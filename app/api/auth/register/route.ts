import { NextResponse } from "next/server";
import { createSession, registerUser, SESSION_COOKIE, SESSION_COOKIE_SECURE, SESSION_MAX_AGE } from "@/lib/auth";
import { requestWelcomeEmail } from "@/lib/mail-service";
export async function POST(request: Request) {
  try {
    const body = await request.json(); const { name, email, username, location = "", password } = body;
    if (![name, email, username, password].every((value) => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Udfyld alle obligatoriske felter." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Indtast en gyldig e-mailadresse." }, { status: 400 });
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return NextResponse.json({ error: "Brugernavnet skal være 3–24 tegn og må kun indeholde bogstaver, tal og _." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Adgangskoden skal være mindst 8 tegn." }, { status: 400 });
    const user = await registerUser({ name, email, username, location, password });
    let welcomeEmailQueued = true;
    try { await requestWelcomeEmail(user); } catch (error) { welcomeEmailQueued = false; console.error("Mailservicen kunne ikke modtage velkomstmailen:", error); }
    const response = NextResponse.json({ user, welcomeEmailQueued }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, createSession(user.id), { httpOnly: true, sameSite: "lax", secure: SESSION_COOKIE_SECURE, path: "/", maxAge: SESSION_MAX_AGE }); return response;
  } catch (error) { const message = error instanceof Error ? error.message : "Kunne ikke oprette brugeren."; return NextResponse.json({ error: message }, { status: message.includes("allerede") ? 409 : 500 }); }
}
