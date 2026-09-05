import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { respondToSessionInvitation } from "@/lib/user-data";

export async function PATCH(request: Request, { params }: { params: { shareId: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  if (body.status !== "accepted" && body.status !== "declined") return NextResponse.json({ error: "Vælg om du vil acceptere eller afslå invitationen." }, { status: 400 });
  const session = await respondToSessionInvitation(user.id, params.shareId, body.status);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Invitationen blev ikke fundet." }, { status: 404 });
}
