import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPlaceSuggestions } from "@/components/AdminPlaceSuggestions";
import { getPlaceSuggestions } from "@/lib/admin";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
export const metadata: Metadata = { title: "Administrér steder · Boulde" };
export default async function AdminPlaces() { const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value); if (!user) redirect("/login"); if (user.role !== "admin") redirect("/steder"); return <AdminPlaceSuggestions initialSuggestions={await getPlaceSuggestions()} />; }
