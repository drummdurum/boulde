import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { completeProjectMedia, listProjectMedia, prepareProjectMedia } from "@/lib/media-service";
import { canViewProject, registerProjectMedia, userOwnsProject } from "@/lib/user-data";
async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  if (!await canViewProject(user.id, params.id)) return NextResponse.json({ error: "Du har ikke adgang til projektet." }, { status: 403 });
  try { return NextResponse.json({ media: await listProjectMedia(params.id) }); }
  catch { return NextResponse.json({ error: "Media-servicen er ikke tilgængelig." }, { status: 503 }); }
}
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser(); if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  if (!await userOwnsProject(user.id, params.id)) return NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 });
  const body = await request.json();
  try {
    if (body.action === "prepare") return NextResponse.json(await prepareProjectMedia({ ownerId: user.id, projectId: params.id, contentType: body.contentType, size: body.size, note: typeof body.note === "string" ? body.note : "" }));
    if (body.action === "complete" && typeof body.mediaId === "string") { const media = await completeProjectMedia(body.mediaId, body.size); if (media.projectId !== params.id) return NextResponse.json({ error: "Mediet tilhører ikke projektet." }, { status: 400 }); await registerProjectMedia(user.id, params.id, media.id); return NextResponse.json({ media }, { status: 201 }); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Media-servicen er ikke tilgængelig." }, { status: 400 }); }
  return NextResponse.json({ error: "Ukendt handling." }, { status: 400 });
}
