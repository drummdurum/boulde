import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime"
};

export async function GET(_: Request, { params }: { params: { kind: string; filename: string } }) {
  if (!new Set(["projects", "posts"]).has(params.kind) || !/^[a-f0-9]{24}\.[a-z0-9]+$/.test(params.filename)) {
    return NextResponse.json({ error: "Filen blev ikke fundet." }, { status: 404 });
  }
  const extension = params.filename.split(".").pop() || "";
  const contentType = contentTypes[extension];
  if (!contentType) return NextResponse.json({ error: "Filtypen understøttes ikke." }, { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "public", "uploads", params.kind, params.filename));
    return new NextResponse(file, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return NextResponse.json({ error: "Filen blev ikke fundet." }, { status: 404 });
  }
}
