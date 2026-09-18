import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSharedSession, joinSharedSession, updateClimbingSession } from "@/lib/user-data";
import { getPlaces } from "@/lib/place-data";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function PATCH(request: Request, { params }: { params: { shareId: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const session = await getSharedSession(params.shareId, user.id);
  if (!session) return NextResponse.json({ error: "Sessionen blev ikke fundet." }, { status: 404 });
  if (session.viewerRole !== "host") return NextResponse.json({ error: "Kun opretteren kan redigere sessionen." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 100 || typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || typeof body.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time))
    return NextResponse.json({ error: "Udfyld en titel på højst 100 tegn samt gyldig dato og tid." }, { status: 400 });
  const date = new Date(`${body.date}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== body.date) return NextResponse.json({ error: "Vælg en gyldig dato." }, { status: 400 });
  const place = (await getPlaces()).find(p => p.id === body.locationId);
  if (!place) return NextResponse.json({ error: "Vælg en gyldig hal." }, { status: 400 });
  const updated = await updateClimbingSession(user.id, params.shareId, { title: body.title.trim(), date: body.date, time: body.time, location: place.name });
  return updated ? NextResponse.json({ session: updated }) : NextResponse.json({ error: "Sessionen kunne ikke opdateres." }, { status: 409 });
}
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
