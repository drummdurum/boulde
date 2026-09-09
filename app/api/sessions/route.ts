import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { createClimbingSession, getUserProjects, getUserSessions } from "@/lib/user-data";
import { getConnectedUsers, getMailRecipients } from "@/lib/social";
import { requestSessionInvitationEmail } from "@/lib/mail-service";
import { canInviteUser } from "@/lib/preferences";

async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }
function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function isValidTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  return NextResponse.json({ sessions: (await getUserSessions(user.id)).filter(Boolean) });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Ugyldig forespørgsel." }, { status: 400 });
  if (![body.title, body.date, body.time, body.location].every(value => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Udfyld titel, dato, tid og sted." }, { status: 400 });
  if (!isValidDate(body.date) || !isValidTime(body.time)) return NextResponse.json({ error: "Vælg en gyldig dato og tid." }, { status: 400 });
  if (body.projectId) { const projects = await getUserProjects(user.id); if (!projects.some(project => project.id === body.projectId)) return NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 }); }
  if (body.inviteeIds !== undefined && (!Array.isArray(body.inviteeIds) || body.inviteeIds.some((id: unknown) => typeof id !== "string" || !id.trim()))) return NextResponse.json({ error: "Invitationerne er ugyldige." }, { status: 400 });
  const inviteeIds: string[] = Array.isArray(body.inviteeIds) ? Array.from(new Set<string>(body.inviteeIds)) : [];
  if (inviteeIds.length) {
    const connectedIds = new Set((await getConnectedUsers(user.id)).map(connection => connection.id));
    if (inviteeIds.some(id => !connectedIds.has(id))) return NextResponse.json({ error: "Du kan kun invitere accepterede forbindelser direkte." }, { status: 400 });
    const allowed = await Promise.all(inviteeIds.map(id => canInviteUser(user.id, id)));
    if (allowed.some(value => !value)) return NextResponse.json({ error: "En eller flere personer modtager ikke sessioninvitationer fra dig." }, { status: 403 });
  }
  const session = await createClimbingSession(user.id, { title: body.title, date: body.date, time: body.time, location: body.location, projectId: typeof body.projectId === "string" ? body.projectId : undefined, inviteeIds });
  if (session && inviteeIds.length) {
    const recipients = await getMailRecipients(inviteeIds);
    await Promise.allSettled(recipients.map(recipient => requestSessionInvitationEmail({
      eventId: `session-invitation-${session.id}-${recipient.id}`, userId: recipient.id, recipient: recipient.email,
      data: { recipientName: recipient.name, hostName: user.name, sessionTitle: session.title, date: session.date, time: session.time, location: session.location, sessionUrl: `${process.env.APP_URL || "http://localhost:3000"}/session/${session.shareId}` }
    }).catch(error => { console.error("Mailservicen kunne ikke modtage sessioninvitationen:", error); throw error; })));
  }
  return NextResponse.json({ session }, { status: 201 });
}
