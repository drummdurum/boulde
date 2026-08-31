import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PlacesPage } from "@/components/PlacesPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getPlaces } from "@/lib/place-data";
export const metadata: Metadata = { title: "Klatresteder · Boulde" };
export default async function Places() { if (!await userFromSession(cookies().get(SESSION_COOKIE)?.value)) redirect("/login"); return <PlacesPage places={await getPlaces()} />; }
