"use client";
import { useMemo, useState } from "react";
import { Check, Clock3, MapPin, Search, UserCheck, UserPlus, Users, X } from "lucide-react";
import type { SocialUser } from "@/lib/social";
import { Button } from "./ui/Button";

export function ClimbersPage({ initialUsers }: { initialUsers: SocialUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState("");
  const visible = useMemo(() => { const value = query.trim().toLowerCase(); return users.filter(user => !value || user.name.toLowerCase().includes(value) || user.username.toLowerCase().includes(value)); }, [query, users]);
  async function toggle(user: SocialUser) {
    setPending(user.id);
    setError("");
    try {
      const response = await fetch(`/api/users/${user.id}/follow`, { method: user.followed ? "DELETE" : "POST" });
      if (!response.ok) throw new Error("Handlingen mislykkedes.");
      setUsers(current => current.map(item => item.id === user.id ? { ...item, followed: !item.followed, followerCount: item.followerCount + (item.followed ? -1 : 1) } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Handlingen mislykkedes."); }
    finally { setPending(undefined); }
  }
  async function changeConnection(user: SocialUser, action: "request" | "accept" | "reject" | "remove") {
    setPending(user.id); setError("");
    try {
      const response = await fetch(`/api/users/${user.id}/connection`, {
        method: action === "request" ? "POST" : action === "remove" ? "DELETE" : "PATCH",
        ...(action === "accept" || action === "reject" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) } : {}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Handlingen mislykkedes.");
      setUsers(current => current.map(item => item.id === user.id ? { ...item, connectionStatus: result.connectionStatus } : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Handlingen mislykkedes."); }
    finally { setPending(undefined); }
  }
  return <main className="min-h-screen px-4 pb-28 pt-5 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10"><div className="mx-auto max-w-[900px]">
    <header><p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">Dit fællesskab</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Find klatrere</h1><p className="mt-2 text-sm font-semibold text-muted">Find andre klatrere og følg deres rejse.</p></header>
    <label className="relative mt-7 block"><span className="sr-only">Søg efter klatrere</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={19} /><input value={query} onChange={event => setQuery(event.target.value)} className="h-12 w-full rounded-2xl border border-line bg-limestone pl-12 pr-4 text-sm font-semibold outline-none focus:border-clay focus:ring-2 focus:ring-clay/20" placeholder="Søg på navn eller brugernavn" /></label>
    {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    <section aria-label="Klatrere" className="mt-5 space-y-3">{visible.map(user => <article key={user.id} className="flex flex-wrap items-center gap-4 rounded-[22px] border border-line bg-limestone p-4 shadow-soft"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pine text-sm font-extrabold text-limestone">{user.initials}</span><div className="min-w-0 flex-1"><h2 className="truncate font-extrabold text-ink">{user.name}</h2><p className="truncate text-xs font-semibold text-muted">@{user.username} · {user.followerCount} {user.followerCount === 1 ? "følger" : "følgere"}</p>{user.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin size={12} />{user.location}</p>}</div><div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end"><Button variant={user.followed ? "outline" : "primary"} size="sm" disabled={pending === user.id} onClick={() => toggle(user)} aria-label={`${user.followed ? "Stop med at følge" : "Følg"} ${user.name}`}>{user.followed ? <UserCheck size={16} /> : <UserPlus size={16} />}{user.followed ? "Følger" : "Følg"}</Button><ConnectionControls user={user} disabled={pending === user.id} onChange={action => changeConnection(user, action)} /></div></article>)}{!visible.length && <p className="rounded-[22px] border border-dashed border-line p-8 text-center text-sm font-semibold text-muted">Ingen klatrere matcher din søgning.</p>}</section>
  </div></main>;
}

function ConnectionControls({ user, disabled, onChange }: { user: SocialUser; disabled: boolean; onChange: (action: "request" | "accept" | "reject" | "remove") => void }) {
  if (user.connectionStatus === "incoming") return <><Button size="sm" disabled={disabled} onClick={() => onChange("accept")} aria-label={`Acceptér forbindelse med ${user.name}`}><Check size={16} />Acceptér</Button><Button variant="outline" size="icon" disabled={disabled} onClick={() => onChange("reject")} aria-label={`Afvis forbindelse med ${user.name}`}><X size={16} /></Button></>;
  if (user.connectionStatus === "outgoing") return <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange("remove")} aria-label={`Annullér forbindelsesanmodning til ${user.name}`}><Clock3 size={16} />Afventer</Button>;
  if (user.connectionStatus === "connected") return <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange("remove")} aria-label={`Fjern forbindelse med ${user.name}`}><Users size={16} />Forbundet</Button>;
  return <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange("request")} aria-label={`Opret forbindelse med ${user.name}`}><Users size={16} />Opret forbindelse</Button>;
}
