import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
export async function GET() { const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value); return user ? NextResponse.json({ user }) : NextResponse.json({ user: null }, { status: 401 }); }
