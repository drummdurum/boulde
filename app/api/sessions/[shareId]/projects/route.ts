import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { addSessionProject, getSharedSession, getUserProjects } from "@/lib/user-data";
import { isProjectAtLocation } from "@/lib/location-match";

export async function POST(request: Request, { params }: { params: { shareId: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const session = await getSharedSession(params.shareId, user.id);
  if (!session) return NextResponse.json({ error: "Sessionen blev ikke fundet." }, { status: 404 });
  if (!session.viewerRole) return NextResponse.json({ error: "Kun opretteren og inviterede kan tilføje projekter." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.projectId !== "string") return NextResponse.json({ error: "Vælg et projekt." }, { status: 400 });
  const project = (await getUserProjects(user.id)).find(p => p.id === body.projectId);
  if (!project) return NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 });
  if (project.status === "Gennemført" || !isProjectAtLocation(project, { name: session.location }))
    return NextResponse.json({ error: "Vælg et aktivt projekt fra sessionens hal." }, { status: 400 });
  const updated = await addSessionProject(user.id, params.shareId, project.id);
  return updated ? NextResponse.json({ session: updated }) : NextResponse.json({ error: "Projektet kunne ikke tilføjes. Opdatér siden." }, { status: 409 });
}
