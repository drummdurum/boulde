import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { downloadProfileImage } from "@/lib/media-service";

export async function GET(_: Request, { params }: { params: { id: string; mediaId: string } }) {
  if (!await userFromSession(cookies().get(SESSION_COOKIE)?.value)) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  try {
    const media = await downloadProfileImage(params.id, params.mediaId);
    if (!media) return NextResponse.json({ error: "Billedet blev ikke fundet." }, { status: 404 });
    return new NextResponse(media.body, { headers: { "Content-Type": media.contentType, "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("Profile image download failed", error);
    return NextResponse.json({ error: "Billedet kunne ikke hentes." }, { status: 502 });
  }
}
