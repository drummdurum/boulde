"use client";
import { FormEvent, useState } from "react";
import type { ClimbingProject, ClimbingSession } from "@/types";
import type { Place } from "@/lib/places";
import { isProjectAtLocation } from "@/lib/location-match";
import { Button } from "./ui/Button";

export function SessionPlanning({ session, projects, locations, onUpdated }: { session: ClimbingSession; projects: ClimbingProject[]; locations: Place[]; onUpdated: (session: ClimbingSession) => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const eligible = projects.filter(p => p.status !== "Gennemført" && isProjectAtLocation(p, { name: session.location }) && !session.projects?.some(selected => selected.id === p.id) && session.project?.id !== p.id);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    await mutate("", "PATCH", Object.fromEntries(values));
  }
  async function mutate(path: string, method: string, body: object) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/sessions/${session.shareId}${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Ændringen kunne ikke gemmes.");
      onUpdated(result.session); setEditing(false); setProjectId("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Ændringen kunne ikke gemmes."); }
    finally { setBusy(false); }
  }
  if (!session.viewerRole) return null;
  const inputClass = "mt-1 block w-full rounded-xl border border-line bg-limestone p-3 text-sm";
  return <section aria-label="Planlæg session" className="mt-6 rounded-2xl bg-sand p-4 text-ink">
    {session.viewerRole === "host" && <>
      <Button variant="outline" disabled={busy} onClick={() => setEditing(!editing)}>{editing ? "Annullér redigering" : "Redigér session"}</Button>
      {editing && <form onSubmit={save} className="mt-4 space-y-3">
        <fieldset disabled={busy} className="space-y-3">
          <label className="block text-sm font-bold">Titel<input name="title" defaultValue={session.title} required maxLength={100} className={inputClass} /></label>
          <label className="block text-sm font-bold">Dato<input type="date" name="date" defaultValue={session.date} required className={inputClass} /></label>
          <label className="block text-sm font-bold">Tid<input type="time" name="time" defaultValue={session.time} required className={inputClass} /></label>
          <label className="block text-sm font-bold">Hal<select name="locationId" defaultValue={locations.find(p => p.name === session.location)?.id || ""} required className={inputClass}><option value="">Vælg hal</option>{locations.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          {(session.project || !!session.projects?.length) && <p className="text-xs text-muted">Hvis du ændrer hal, fjernes projekter fra andre haller fra sessionen. Selve projekterne bevares.</p>}
        </fieldset>
        <Button type="submit" disabled={busy}>{busy ? "Gemmer…" : "Gem session"}</Button>
      </form>}
    </>}
    <h2 className="mt-4 text-lg font-extrabold">Projekter til sessionen</h2>
    <p className="mt-1 text-sm text-muted">Alle inviterede kan byde ind med egne aktive projekter fra {session.location}. Projekterne deles med opretteren og de inviterede.</p>
    {!!session.projects?.length && <ul className="mt-3 space-y-2">{session.projects.map(p => <li key={p.id} className="rounded-xl bg-limestone p-3"><strong>{p.name}</strong><span className="block text-sm text-muted">{p.grade}{p.colorGrade ? ` · ${p.colorGrade}` : ""} · {p.ownerName}</span></li>)}</ul>}
    {eligible.length ? <div className="mt-3 space-y-3"><label className="block text-sm font-bold">Dit projekt<select value={projectId} onChange={event => setProjectId(event.target.value)} disabled={busy} className={inputClass}><option value="">Vælg projekt</option>{eligible.map(p => <option key={p.id} value={p.id}>{p.name} · {p.grade}</option>)}</select></label><Button disabled={busy || !projectId} onClick={() => mutate("/projects", "POST", { projectId })}>{busy ? "Gemmer…" : "Tilføj projekt"}</Button></div> : <p className="mt-3 text-sm text-muted">Du har ingen flere aktive projekter i denne hal at tilføje.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
