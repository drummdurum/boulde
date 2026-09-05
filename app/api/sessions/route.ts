import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { createClimbingSession, getUserProjects, getUserSessions } from "@/lib/user-data";
import { getConnectedUsers } from "@/lib/social";
import { canInviteUser } from "@/lib/preferences";

async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  return NextResponse.json({ sessions: (await getUserSessions(user.id)).filter(Boolean) });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  if (![body.title, body.date, body.time, body.location].every(value => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Udfyld titel, dato, tid og sted." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !/^\d{2}:\d{2}$/.test(body.time)) return NextResponse.json({ error: "Vælg en gyldig dato og tid." }, { status: 400 });
  if (body.projectId) { const projects = await getUserProjects(user.id); if (!projects.some(project => project.id === body.projectId)) return NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 }); }
  const inviteeIds: string[] = Array.isArray(body.inviteeIds) ? Array.from(new Set<string>(body.inviteeIds.filter((id: unknown): id is string => typeof id === "string"))) : [];
  if (inviteeIds.length) {
    const connectedIds = new Set((await getConnectedUsers(user.id)).map(connection => connection.id));
    if (inviteeIds.some(id => !connectedIds.has(id))) return NextResponse.json({ error: "Du kan kun invitere accepterede forbindelser direkte." }, { status: 400 });
    const allowed = await Promise.all(inviteeIds.map(id => canInviteUser(user.id, id)));
    if (allowed.some(value => !value)) return NextResponse.json({ error: "En eller flere personer modtager ikke sessioninvitationer fra dig." }, { status: 403 });
  }
  const session = await createClimbingSession(user.id, { title: body.title, date: body.date, time: body.time, location: body.location, projectId: typeof body.projectId === "string" ? body.projectId : undefined, inviteeIds });
  return NextResponse.json({ session }, { status: 201 });
}
