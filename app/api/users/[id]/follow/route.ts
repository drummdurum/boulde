import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { followUser, unfollowUser } from "@/lib/social";

async function currentUser() { return userFromSession(cookies().get(SESSION_COOKIE)?.value); }
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  try { await followUser(user.id, params.id); return NextResponse.json({ followed: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Kunne ikke følge brugeren." }, { status: 400 }); }
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  await unfollowUser(user.id, params.id);
  return NextResponse.json({ followed: false });
}
