import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SessionsPage } from "@/components/SessionsPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getUserProjects, getUserSessions } from "@/lib/user-data";
import { getConnectedUsers } from "@/lib/social";
import { getClimbingLocations } from "@/lib/locations";
export const metadata: Metadata = { title: "Sessioner · Boulde" };
export default async function Page() { const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value); if (!user) redirect("/login"); const [sessions, projects, connections, locations] = await Promise.all([getUserSessions(user.id), getUserProjects(user.id), getConnectedUsers(user.id), getClimbingLocations()]); return <SessionsPage initialSessions={sessions.filter(Boolean) as NonNullable<(typeof sessions)[number]>[]} projects={projects} connections={connections} locations={locations} />; }
