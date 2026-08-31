import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SuggestPlaceForm } from "@/components/SuggestPlaceForm";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
export const metadata: Metadata = { title: "Foreslå et sted · Boulde" };
export default async function SuggestPlace() { if (!await userFromSession(cookies().get(SESSION_COOKIE)?.value)) redirect("/login"); return <SuggestPlaceForm />; }
