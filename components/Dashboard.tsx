"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ImagePlus, MapPinned, Target, Users } from "lucide-react";
import type { User } from "@/types";
import type { ClimbingProject, ClimbingSession, Post, ProjectFeedItem } from "@/types";
import { DashboardHeader } from "./DashboardHeader";
import { StatCard } from "./StatCard";
import { ProjectSection } from "./ProjectSection";
import { CreatePostModal } from "./CreatePostModal";
import { FeedPost } from "./FeedPost";
import { FollowingProjectCard } from "./FollowingProjectCard";
import type { ConnectionRequest } from "@/lib/social";

export function Dashboard({ user, initialPosts, initialProjects, followingProjects = [], invitations = [], connectionRequests = [] }: { user: User; initialPosts: Post[]; initialProjects: ClimbingProject[]; followingProjects?: ProjectFeedItem[]; invitations?: ClimbingSession[]; connectionRequests?: ConnectionRequest[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [sessionInvitations, setSessionInvitations] = useState(invitations);
  const [pendingConnections, setPendingConnections] = useState(connectionRequests);
  useEffect(() => { fetch("/api/sessions").then(response => response.ok ? response.json() : { sessions: [] }).then(result => setSessionInvitations((result.sessions || []).filter((session: ClimbingSession) => session.viewerRole === "invitee" && session.invitationStatus === "pending"))).catch(() => undefined); }, []);
  const month = new Date().toISOString().slice(0, 7);
  const completedClimbs = initialProjects.filter(project => project.status === "Gennemført").length;
  const visitedLocations = new Set(initialProjects
    .filter(project => project.attempts > 0 || project.status === "Gennemført")
    .map(project => project.location.trim().toLocaleLowerCase("da-DK"))
    .filter(Boolean)).size;
  const completedThisMonth = initialProjects.filter(project => project.status === "Gennemført" && project.lastAttempt.startsWith(month)).length;
  return <main className="min-h-screen px-4 pb-28 pt-6 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10">
    <div className="mx-auto max-w-[1460px]">
      <DashboardHeader user={user} onCreate={() => setCreateOpen(true)} notificationCount={sessionInvitations.length + pendingConnections.length} />
      {pendingConnections.length > 0 && <ConnectionRequests requests={pendingConnections} onHandled={id => setPendingConnections(current => current.filter(item => item.id !== id))} />}
      {sessionInvitations.length > 0 && <SessionInvitations invitations={sessionInvitations} onHandled={id => setSessionInvitations(current => current.filter(item => item.id !== id))} />}
      <section aria-label="Din klatrestatus" className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Gennemførte klatringer" value={String(completedClimbs)} change={completedClimbs ? `${completedClimbs} i alt` : "Kom i gang"} icon={CheckCircle2} />
        <StatCard label="Aktive projekter" value={String(initialProjects.filter(project => project.status !== "Gennemført").length)} change={initialProjects.length ? "Dine projekter" : "Ingen endnu"} icon={Target} tone="ochre" />
        <StatCard label="Klatresteder besøgt" value={String(visitedLocations)} change={visitedLocations ? `${visitedLocations} ${visitedLocations === 1 ? "sted" : "steder"}` : "Ingen endnu"} icon={MapPinned} tone="moss" />
        <StatCard label="Klatringer denne måned" value={String(completedThisMonth)} change={completedThisMonth ? "Gennemført" : "Ingen endnu"} icon={CalendarDays} tone="clay" />
      </section>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.85fr)]">
        <section aria-labelledby="feed-title"><div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">Dit fællesskab</p><h2 id="feed-title" className="mt-1 text-2xl font-extrabold text-ink">Seneste på væggen</h2><p className="mt-1 text-sm font-semibold text-muted">Offentlige projekter fra dem, du følger, og dine egne opslag.</p></div><div className="space-y-6">{followingProjects.map(item => <FollowingProjectCard key={item.project.id} item={item} />)}{posts.map(post => <FeedPost key={post.id} post={post} />)}</div>{!followingProjects.length && !posts.length && <div className="grid min-h-80 place-items-center rounded-[26px] border border-dashed border-line bg-limestone p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sand text-clay"><ImagePlus size={25} /></span><h3 className="mt-5 text-lg font-extrabold text-ink">Dit feed er klar</h3><p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-muted">Følg andre klatrere for at se deres offentlige projekter, billeder og videoer her.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Link href="/klatrere" className="rounded-2xl bg-pine px-5 py-3 text-sm font-extrabold text-limestone">Find klatrere</Link><button onClick={() => setCreateOpen(true)} className="rounded-2xl border border-line bg-limestone px-5 py-3 text-sm font-extrabold text-pine">Opret opslag</button></div></div></div>}</section>
        <aside className="space-y-8"><ProjectSection projects={initialProjects} />{!initialProjects.length && <section className="rounded-[24px] bg-pine p-6 text-limestone"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-limestone/60">Næste skridt</p><h2 className="mt-2 text-xl font-extrabold">Opret dit første projekt</h2><p className="mt-2 text-sm font-semibold leading-6 text-limestone/70">Saml beta og forsøg på den linje, du arbejder på.</p><Link href="/projekter" className="mt-5 inline-flex rounded-xl bg-limestone px-4 py-2.5 text-sm font-extrabold text-pine">Gå til projekter</Link></section>}</aside>
      </div>
    </div>
    <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={post => setPosts(current => [post, ...current])} />
  </main>;
}

function ConnectionRequests({ requests, onHandled }: { requests: ConnectionRequest[]; onHandled: (id: string) => void }) {
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  async function respond(id: string, action: "accept" | "reject") {
    setPending(id); setError("");
    const response = await fetch(`/api/users/${id}/connection`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setPending(undefined);
    if (response.ok) onHandled(id);
    else setError((await response.json().catch(() => ({}))).error || "Kunne ikke besvare forbindelsesanmodningen.");
  }
  return <section aria-labelledby="connection-requests-title" className="mb-8 rounded-[24px] border border-line bg-limestone p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">Ny forbindelse</p><h2 id="connection-requests-title" className="mt-1 text-xl font-extrabold">Forbindelsesanmodninger</h2></div><Users className="text-clay" /></div><div className="mt-4 grid gap-3 md:grid-cols-2">{requests.map(request => <article key={request.id} className="flex items-center gap-3 rounded-2xl bg-sand p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pine text-xs font-extrabold text-limestone">{request.initials}</span><div className="min-w-0 flex-1"><h3 className="truncate font-extrabold">{request.name}</h3><p className="truncate text-sm font-semibold text-muted">@{request.username} vil oprette forbindelse</p></div><div className="flex gap-2"><button disabled={pending === request.id} onClick={() => respond(request.id, "accept")} className="rounded-full bg-pine px-4 py-2 text-xs font-extrabold text-limestone disabled:opacity-50">Acceptér</button><button disabled={pending === request.id} onClick={() => respond(request.id, "reject")} className="rounded-full border border-line px-4 py-2 text-xs font-extrabold text-ink disabled:opacity-50">Afvis</button></div></article>)}</div>{error && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}</section>;
}

function SessionInvitations({ invitations, onHandled }: { invitations: ClimbingSession[]; onHandled: (id: string) => void }) {
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  async function respond(session: ClimbingSession, status: "accepted" | "declined") {
    setPending(session.id); setError("");
    const response = await fetch(`/api/sessions/${session.shareId}/invitation`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setPending(undefined);
    if (response.ok) onHandled(session.id);
    else setError((await response.json().catch(() => ({}))).error || "Invitationen kunne ikke håndteres.");
  }
  return <section aria-labelledby="session-invitations-title" className="mb-8 rounded-[24px] border border-line bg-limestone p-5 shadow-soft"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">Invitation</p><h2 id="session-invitations-title" className="mt-1 text-xl font-extrabold">Sessioninvitationer</h2></div><CalendarDays className="text-clay" /></div><div className="mt-4 grid gap-3 md:grid-cols-2">{invitations.map(session => <article key={session.id} className="rounded-2xl bg-sand p-4"><h3 className="font-extrabold">{session.title}</h3><p className="mt-1 text-sm font-semibold text-muted">Inviteret af {session.host.name} · {session.date} kl. {session.time}</p><p className="mt-1 text-sm font-semibold text-muted">{session.location}</p><div className="mt-4 flex gap-2"><button disabled={pending === session.id} onClick={() => respond(session, "accepted")} className="rounded-full bg-pine px-4 py-2 text-xs font-extrabold text-limestone disabled:opacity-50">Acceptér</button><button disabled={pending === session.id} onClick={() => respond(session, "declined")} className="rounded-full border border-line px-4 py-2 text-xs font-extrabold text-ink disabled:opacity-50">Afslå</button><Link href={`/session/${session.shareId}`} className="ml-auto rounded-full border border-line px-4 py-2 text-xs font-extrabold text-ink">Åbn</Link></div></article>)}</div>{error && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{error}</p>}</section>;
}
