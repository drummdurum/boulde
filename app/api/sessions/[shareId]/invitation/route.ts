import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getSharedSession, inviteConnectionsToSession, respondToSessionInvitation } from "@/lib/user-data";
import { getConnectedUsers, getMailRecipients } from "@/lib/social";
import { canInviteUser } from "@/lib/preferences";
import { requestSessionInvitationEmail } from "@/lib/mail-service";

export async function POST(request: Request, { params }: { params: { shareId: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.inviteeIds) || !body.inviteeIds.length || body.inviteeIds.some((id: unknown) => typeof id !== "string" || !id.trim())) return NextResponse.json({ error: "Vælg mindst én gyldig forbindelse." }, { status: 400 });
  const inviteeIds = Array.from(new Set<string>(body.inviteeIds));
  const connectedIds = new Set((await getConnectedUsers(user.id)).map(connection => connection.id));
  if (inviteeIds.some(id => !connectedIds.has(id))) return NextResponse.json({ error: "Du kan kun invitere accepterede forbindelser direkte." }, { status: 400 });
  const allowed = await Promise.all(inviteeIds.map(id => canInviteUser(user.id, id)));
  if (allowed.some(value => !value)) return NextResponse.json({ error: "En eller flere personer modtager ikke sessioninvitationer fra dig." }, { status: 403 });
  const invited = await inviteConnectionsToSession(user.id, params.shareId, inviteeIds);
  if (invited) {
    const [session, recipients] = await Promise.all([getSharedSession(params.shareId, user.id), getMailRecipients(inviteeIds)]);
    if (session) await Promise.allSettled(recipients.map(recipient => requestSessionInvitationEmail({
      eventId: `session-invitation-${session.id}-${recipient.id}`, userId: recipient.id, recipient: recipient.email,
      data: { recipientName: recipient.name, hostName: user.name, sessionTitle: session.title, date: session.date, time: session.time, location: session.location, sessionUrl: `${process.env.APP_URL || "http://localhost:3000"}/session/${session.shareId}` }
    }).catch(error => { console.error("Mailservicen kunne ikke modtage sessioninvitationen:", error); throw error; })));
  }
  return invited ? NextResponse.json({ invited: inviteeIds.length }) : NextResponse.json({ error: "Sessionen blev ikke fundet, eller du er ikke vært." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: { shareId: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.status !== "accepted" && body?.status !== "declined") return NextResponse.json({ error: "Vælg om du vil acceptere eller afslå invitationen." }, { status: 400 });
  const session = await respondToSessionInvitation(user.id, params.shareId, body.status);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Invitationen blev ikke fundet." }, { status: 404 });
}
