import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getSessionInvitePolicy, setSessionInvitePolicy, type SessionInvitePolicy } from "@/lib/preferences";

async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  return NextResponse.json({ sessionInvitePolicy: await getSessionInvitePolicy(user.id) });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  const allowed: SessionInvitePolicy[] = ["everyone", "following", "connections", "none"];
  if (!allowed.includes(body.sessionInvitePolicy)) return NextResponse.json({ error: "Vælg en gyldig indstilling." }, { status: 400 });
  await setSessionInvitePolicy(user.id, body.sessionInvitePolicy);
  return NextResponse.json({ sessionInvitePolicy: body.sessionInvitePolicy });
}
