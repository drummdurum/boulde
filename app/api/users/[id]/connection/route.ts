import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { acceptConnection, getMailRecipients, rejectConnection, removeConnection, requestConnection } from "@/lib/social";
import { requestConnectionRequestEmail } from "@/lib/mail-service";

async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  try {
    await requestConnection(user.id, params.id);
    const recipient = (await getMailRecipients([params.id]))[0];
    if (recipient) await requestConnectionRequestEmail({
      eventId: `connection-request-${user.id}-${recipient.id}`, userId: recipient.id, recipient: recipient.email,
      data: { recipientName: recipient.name, senderName: user.name, connectionsUrl: `${process.env.APP_URL || "http://localhost:3000"}/klatrere` }
    }).catch(error => console.error("Mailservicen kunne ikke modtage forbindelsesanmodningen:", error));
    return NextResponse.json({ connectionStatus: "outgoing" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kunne ikke sende forbindelsesanmodningen." }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== "accept" && body?.action !== "reject") return NextResponse.json({ error: "Vælg acceptér eller afvis." }, { status: 400 });
  try {
    if (body.action === "accept") {
      await acceptConnection(user.id, params.id);
      return NextResponse.json({ connectionStatus: "connected" });
    }
    await rejectConnection(user.id, params.id);
    return NextResponse.json({ connectionStatus: "none" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kunne ikke besvare forbindelsesanmodningen." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  await removeConnection(user.id, params.id);
  return NextResponse.json({ connectionStatus: "none" });
}
