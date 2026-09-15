import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { downloadProjectMedia } from "@/lib/media-service";
import { canViewProject } from "@/lib/user-data";

export async function GET(
  _: Request,
  { params }: { params: { id: string; mediaId: string } },
) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user)
    return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  if (!(await canViewProject(user.id, params.id)))
    return NextResponse.json({ error: "Du har ikke adgang til projektet." }, { status: 403 });

  try {
    const media = await downloadProjectMedia(params.id, params.mediaId);
    if (!media)
      return NextResponse.json({ error: "Mediet blev ikke fundet." }, { status: 404 });
    return new NextResponse(media.body, {
      headers: {
        "Content-Type": media.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Mediet kunne ikke hentes." }, { status: 502 });
  }
}
