import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { canViewProject, createProjectMedia, getProjectMedia, userOwnsProject } from "@/lib/user-data";
import { createReadUrl, createUploadUrl, storedObjectExists } from "@/lib/storage";

const MAX_SIZE = 50 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  if (!await canViewProject(user.id, params.id)) return NextResponse.json({ error: "Du har ikke adgang til projektet." }, { status: 403 });
  const media = await getProjectMedia(params.id); return NextResponse.json({ media: await Promise.all(media.map(async item => ({ id: item.id, projectId: params.id, type: item.type, contentType: item.contentType, size: Number(item.size), note: item.note, createdAt: item.createdAt.toString(), url: item.publicUrl || (item.storageKey ? await createReadUrl(item.storageKey) : "") }))) });
}
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  if (!await userOwnsProject(user.id, params.id)) return NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 });
  const body = await request.json();
  if (body.action === "prepare") { if (!allowedTypes.has(body.contentType) || !Number.isInteger(body.size) || body.size < 1 || body.size > MAX_SIZE) return NextResponse.json({ error: "Vælg et JPG, PNG, WebP, MP4 eller WebM på højst 50 MB." }, { status: 400 }); const extension = body.contentType.split("/")[1].replace("jpeg", "jpg"); const key = `projects/${params.id}/${randomBytes(16).toString("hex")}.${extension}`; return NextResponse.json({ key, uploadUrl: await createUploadUrl(key, body.contentType) }); }
  if (body.action === "complete") { if (typeof body.key !== "string" || !body.key.startsWith(`projects/${params.id}/`) || !allowedTypes.has(body.contentType) || !Number.isInteger(body.size) || !await storedObjectExists(body.key, body.size)) return NextResponse.json({ error: "Uploaden kunne ikke bekræftes." }, { status: 400 }); const media = await createProjectMedia(user.id, params.id, { key: body.key, contentType: body.contentType, size: body.size, note: typeof body.note === "string" ? body.note : "" }); return NextResponse.json({ media }, { status: 201 }); }
  return NextResponse.json({ error: "Ukendt handling." }, { status: 400 });
}
