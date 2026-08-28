import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { createUserProject, getUserProjects, setProjectVisibility } from "@/lib/user-data";
import type { ClimbingGrade } from "@/types";

const grades = new Set(["5+", "6A", "6B", "6C", "7A", "7A+", "7B", "7C", "8A"]);
async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function GET() {
  const user = await currentUser();
  return user ? NextResponse.json({ projects: await getUserProjects(user.id) }) : NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  if (![body.name, body.location].every(value => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Udfyld projektnavn og sted." }, { status: 400 });
  if (!grades.has(body.grade)) return NextResponse.json({ error: "Vælg en gyldig grade." }, { status: 400 });
  return NextResponse.json({ project: await createUserProject(user.id, { name: body.name, location: body.location, grade: body.grade as ClimbingGrade, note: typeof body.note === "string" ? body.note : "", visible: body.visible === true || body.visible === "on" }) }, { status: 201 });
}
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  if (typeof body.id !== "string" || typeof body.visible !== "boolean") return NextResponse.json({ error: "Ugyldig synlighed." }, { status: 400 });
  const project = await setProjectVisibility(user.id, body.id, body.visible);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 });
}
