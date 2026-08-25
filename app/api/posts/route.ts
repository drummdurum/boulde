import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { createUserPost, getUserPosts } from "@/lib/user-data";
import type { ClimbingGrade, ClimbingType } from "@/types";

const grades = new Set(["5+", "6A", "6B", "6C", "7A", "7A+", "7B", "7C", "8A"]);
const types = new Set(["Boulder", "Sportsklatring", "Indendørs"]);
async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }

export async function GET() {
  const user = await currentUser();
  return user ? NextResponse.json({ posts: await getUserPosts(user) }) : NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const body = await request.json();
  if (![body.description, body.route, body.location].every(value => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Udfyld beskrivelse, rute og sted." }, { status: 400 });
  if (!grades.has(body.grade) || !types.has(body.type)) return NextResponse.json({ error: "Vælg en gyldig grade og klatretype." }, { status: 400 });
  return NextResponse.json({ post: await createUserPost(user, { ...body, grade: body.grade as ClimbingGrade, type: body.type as ClimbingType }) }, { status: 201 });
}
