import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LocationsPage } from "@/components/LocationsPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getClimbingLocations } from "@/lib/locations";

export const metadata: Metadata = { title: "Klatresteder · Boulde" };
export default async function Page() {
  if (!await userFromSession(cookies().get(SESSION_COOKIE)?.value)) redirect("/login");
  return <LocationsPage locations={await getClimbingLocations()} />;
}
