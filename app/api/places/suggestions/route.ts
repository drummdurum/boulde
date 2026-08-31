import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { database, db } from "@/lib/db";

const allowedTypes = new Set(["Bouldering", "Rebklatring", "Udendørs", "Andet"]);
export async function POST(request: Request) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  const required = [body.name, body.street, body.postalCode, body.city];
  if (!required.every(value => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Udfyld navn, adresse, postnummer og by." }, { status: 400 });
  if (!allowedTypes.has(body.type)) return NextResponse.json({ error: "Vælg en gyldig type." }, { status: 400 });
  await db.executeQuery(`MATCH (u:User {id: $userId}) CREATE (u)-[:SUGGESTED]->(:PlaceSuggestion { id: $id, name: $name, street: $street, postalCode: $postalCode, city: $city, placeType: $type, note: $note, status: 'Afventer', createdAt: datetime() })`, { userId: user.id, id: randomBytes(12).toString("hex"), name: body.name.trim(), street: body.street.trim(), postalCode: body.postalCode.trim(), city: body.city.trim(), type: body.type, note: typeof body.note === "string" ? body.note.trim() : "" }, { database, routing: "WRITE" });
  return NextResponse.json({ ok: true }, { status: 201 });
}
