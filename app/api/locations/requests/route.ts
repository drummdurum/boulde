import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { createLocationRequest } from "@/lib/locations";

export async function POST(request: Request) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  if (typeof body.name !== "string" || !body.name.trim() || typeof body.address !== "string" || !body.address.trim()) return NextResponse.json({ error: "Udfyld navn og adresse." }, { status: 400 });
  if (body.name.length > 100 || body.address.length > 180 || body.website?.length > 300 || body.note?.length > 1000) return NextResponse.json({ error: "Et eller flere felter er for lange." }, { status: 400 });
  const id = await createLocationRequest(user.id, { name: body.name, address: body.address, website: typeof body.website === "string" ? body.website : "", note: typeof body.note === "string" ? body.note : "" });
  return NextResponse.json({ id, message: "Tak! Dit forslag er sendt til gennemgang." }, { status: 201 });
}
