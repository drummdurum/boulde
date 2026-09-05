import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { acceptConnection, rejectConnection, removeConnection, requestConnection } from "@/lib/social";

async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  try {
    await requestConnection(user.id, params.id);
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
