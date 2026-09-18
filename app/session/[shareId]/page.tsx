import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SharedSessionPage } from "@/components/SharedSessionPage";
import { getPlaces } from "@/lib/place-data";
import { getSharedSession, getUserProjects } from "@/lib/user-data";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getConnectedUsers } from "@/lib/social";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Klatresession · Boulde" };
export default async function Page({ params }: { params: { shareId: string } }) { const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value); const session = await getSharedSession(params.shareId, user?.id); if (!session) notFound(); const connections = session.viewerRole === "host" && user ? await getConnectedUsers(user.id) : []; const [projects, locations] = user && session.viewerRole ? await Promise.all([getUserProjects(user.id), getPlaces()]) : [[], []]; return <SharedSessionPage initialSession={session} connections={connections} projects={projects} locations={locations} />; }
