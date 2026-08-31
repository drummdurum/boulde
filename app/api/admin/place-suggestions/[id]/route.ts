import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { database, db } from "@/lib/db";

function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Kun administratorer har adgang." }, { status: 403 });
  const { action } = await request.json();
  if (action === "reject") { const result = await db.executeQuery("MATCH (s:PlaceSuggestion {id: $id, status: 'Afventer'}) SET s.status = 'Afvist', s.reviewedAt = datetime(), s.reviewedBy = $adminId RETURN s", { id: params.id, adminId: admin.id }, { database, routing: "WRITE" }); return result.records.length ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Forslaget kunne ikke findes." }, { status: 404 }); }
  if (action !== "approve") return NextResponse.json({ error: "Ugyldig handling." }, { status: 400 });
  const lookup = await db.executeQuery("MATCH (s:PlaceSuggestion {id: $id, status: 'Afventer'}) RETURN s", { id: params.id }, { database }); const suggestion = lookup.records[0]?.get("s")?.properties; if (!suggestion) return NextResponse.json({ error: "Forslaget kunne ikke findes." }, { status: 404 });
  const slug = `${slugify(suggestion.name)}-${randomBytes(3).toString("hex")}`; const placeId = randomBytes(12).toString("hex");
  await db.executeQuery(`MATCH (s:PlaceSuggestion {id: $suggestionId}) CREATE (p:Place {id: $placeId, slug: $slug, name: s.name, street: s.street, postalCode: s.postalCode, city: s.city, type: s.placeType, image: '/images/nordic-boulder.png', imageAlt: 'Klatring hos ' + s.name, status: 'Godkendt', createdAt: datetime()}) SET s.status = 'Godkendt', s.reviewedAt = datetime(), s.reviewedBy = $adminId CREATE (s)-[:PUBLISHED_AS]->(p)`, { suggestionId: params.id, placeId, slug, adminId: admin.id }, { database, routing: "WRITE" });
  return NextResponse.json({ ok: true, slug });
}
