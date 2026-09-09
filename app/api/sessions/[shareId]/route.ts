import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSharedSession, joinSharedSession } from "@/lib/user-data";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: { shareId: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  const session = await getSharedSession(params.shareId, user?.id);
  return session ? NextResponse.json({ session }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Sessionen blev ikke fundet." }, { status: 404 });
}
export async function POST(request: Request, { params }: { params: { shareId: string } }) {
  const body = await request.json();
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 60) return NextResponse.json({ error: "Skriv dit navn (2–60 tegn)." }, { status: 400 });
  const session = await joinSharedSession(params.shareId, body.name);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Sessionen blev ikke fundet." }, { status: 404 });
}
