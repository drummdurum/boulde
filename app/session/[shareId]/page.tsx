import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SharedSessionPage } from "@/components/SharedSessionPage";
import { getSharedSession } from "@/lib/user-data";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getConnectedUsers } from "@/lib/social";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Klatresession · Boulde" };
export default async function Page({ params }: { params: { shareId: string } }) { const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value); const session = await getSharedSession(params.shareId, user?.id); if (!session) notFound(); const connections = session.viewerRole === "host" && user ? await getConnectedUsers(user.id) : []; return <SharedSessionPage initialSession={session} connections={connections} />; }
