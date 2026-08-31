import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedSessionPage } from "@/components/SharedSessionPage";
import { getSharedSession } from "@/lib/user-data";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Klatresession · Boulde" };
export default async function Page({ params }: { params: { shareId: string } }) { const session = await getSharedSession(params.shareId); if (!session) notFound(); return <SharedSessionPage initialSession={session} />; }
