import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { createUserPost, getUserPosts } from "@/lib/user-data";
async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function GET() {
  const user = await currentUser();
  return user ? NextResponse.json({ posts: await getUserPosts(user) }) : NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.formData();
  const description = body.get("description"); const mediaFile = body.get("media");
  if (typeof description !== "string" || !description.trim()) return NextResponse.json({ error: "Skriv noget i opslaget." }, { status: 400 });
  let media: string | undefined; let isVideo = false;
  if (mediaFile instanceof Blob && mediaFile.size > 0) {
    const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
    const extension = extensions[mediaFile.type];
    if (!extension) return NextResponse.json({ error: "Vælg en gyldig billed- eller videofil." }, { status: 400 });
    isVideo = mediaFile.type.startsWith("video/");
    if (mediaFile.size > (isVideo ? 50 : 8) * 1024 * 1024) return NextResponse.json({ error: isVideo ? "Videoen må højst fylde 50 MB." : "Billedet må højst fylde 8 MB." }, { status: 400 });
    const filename = `${randomBytes(12).toString("hex")}.${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "posts");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), Buffer.from(await mediaFile.arrayBuffer()));
    media = `/api/uploads/posts/${filename}`;
  }
  return NextResponse.json({ post: await createUserPost(user, { description, media, isVideo }) }, { status: 201 });
}
