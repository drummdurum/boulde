import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { findUsers } from "@/lib/social";

export async function GET(request: Request) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const query = new URL(request.url).searchParams.get("q") || "";
  return NextResponse.json({ users: await findUsers(user.id, query) });
}
