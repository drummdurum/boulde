import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { placeById } from "@/lib/places";
import { getMapProblems } from "@/lib/map-problems";

export async function GET(request: Request) {
  if (!await userFromSession(cookies().get(SESSION_COOKIE)?.value)) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const place = placeById(new URL(request.url).searchParams.get("placeId") ?? "");
  if (!place) return NextResponse.json({ error: "Vælg en gyldig hal." }, { status: 400 });
  return NextResponse.json({ problems: await getMapProblems(place.slug) });
}
