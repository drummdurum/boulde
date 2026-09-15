"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  MapPin,
  Plus,
  Share2,
  Target,
  UserPlus,
  X,
} from "lucide-react";
import type {
  ClimbingLocation,
  ClimbingProject,
  ClimbingSession,
  SessionInvitee,
} from "@/types";
import { isProjectAtLocation } from "@/lib/location-match";
import { Button } from "./ui/Button";

export function SessionsPage({
  initialSessions,
  projects,
  connections,
  locations,
}: {
  initialSessions: ClimbingSession[];
  projects: ClimbingProject[];
  connections: SessionInvitee[];
  locations: ClimbingLocation[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const [responding, setResponding] = useState("");
  async function copyLink(shareId: string) {
    const url = `${window.location.origin}/session/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(shareId);
    window.setTimeout(() => setCopied(""), 1800);
  }
  async function respond(
    session: ClimbingSession,
    status: "accepted" | "declined",
  ) {
    setResponding(session.id);
    try {
      const response = await fetch(
        `/api/sessions/${session.shareId}/invitation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSessions((current) =>
        current.map((item) => (item.id === session.id ? result.session : item)),
      );
    } finally {
      setResponding("");
    }
  }
  return (
    <main className="min-h-screen px-4 pb-28 pt-6 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10">
      <div className="mx-auto max-w-[1100px]">
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">
              Klatr sammen
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">
              Sessioner
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-muted">
              Planlæg en klatring, del linket og se med det samme, hvem der er
              med.
            </p>
          </div>
          <Button className="shrink-0" onClick={() => setOpen(true)}>
            <Plus size={18} />
            Ny session
          </Button>
        </header>
        {sessions.length ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="min-w-0 rounded-[24px] border border-line bg-limestone p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-clay">
                      {formatDate(session.date)}
                    </p>
                    <h2 className="mt-1 break-words text-xl font-extrabold text-ink">
                      {session.title}
                    </h2>
                    {session.viewerRole === "invitee" && (
                      <p className="mt-1 text-xs font-bold text-muted">
                        Inviteret af {session.host.name}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e4eee5] px-3 py-1.5 text-xs font-extrabold text-positive">
                    {session.participants.length} med
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm font-semibold text-muted">
                  <p className="flex items-center gap-2">
                    <Clock size={16} />
                    {session.time}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={16} />
                    {session.location}
                  </p>
                  {session.project && (
                    <p className="flex items-center gap-2">
                      <Target size={16} />
                      {session.project.name} · {session.project.grade}
                    </p>
                  )}
                </div>
                {session.invitationStatus === "pending" && (
                  <div className="mt-5 flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={responding === session.id}
                      onClick={() => respond(session, "accepted")}
                    >
                      <Check size={16} />
                      Acceptér
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={responding === session.id}
                      onClick={() => respond(session, "declined")}
                    >
                      <X size={16} />
                      Afslå
                    </Button>
                  </div>
                )}
                {session.invitationStatus === "declined" && (
                  <p className="mt-5 rounded-2xl bg-sand p-3 text-center text-sm font-bold text-muted">
                    Du har afslået invitationen
                  </p>
                )}
                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/session/${session.shareId}`}
                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-pine px-4 text-sm font-bold text-limestone"
                  >
                    Åbn session
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => copyLink(session.shareId)}
                  >
                    <Copy size={15} />
                    {copied === session.shareId ? "Kopieret" : "Del"}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-8 grid min-h-[390px] place-items-center rounded-[28px] border border-dashed border-line bg-limestone p-8 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-sand text-clay">
                <CalendarDays size={28} />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold">
                Ingen sessioner endnu
              </h2>
              <p className="mt-2 text-sm font-semibold text-muted">
                Opret den første og invitér dine klatrevenner.
              </p>
              <Button className="mt-6" onClick={() => setOpen(true)}>
                <Plus size={18} />
                Opret session
              </Button>
            </div>
          </section>
        )}
      </div>
      {open && (
        <CreateSessionModal
          projects={projects}
          connections={connections}
          locations={locations}
          onClose={() => setOpen(false)}
          onCreated={(session) => {
            setSessions((current) => [...current, session]);
            setOpen(false);
          }}
        />
      )}
    </main>
  );
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}
function CreateSessionModal({
  projects,
  connections,
  locations,
  onClose,
  onCreated,
}: {
  projects: ClimbingProject[];
  connections: SessionInvitee[];
  locations: ClimbingLocation[];
  onClose: () => void;
  onCreated: (session: ClimbingSession) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationId, setLocationId] = useState("");
  const [projectId, setProjectId] = useState("");
  const selectedLocation = locations.find(
    (location) => location.id === locationId,
  );
  const eligibleProjects = selectedLocation
    ? projects.filter(
        (project) =>
          project.status !== "Gennemført" &&
          isProjectAtLocation(project, selectedLocation),
      )
    : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const body = {
        ...Object.fromEntries(form),
        inviteeIds: form.getAll("inviteeIds"),
      };
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onCreated(result.session);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Sessionen kunne ikke oprettes.",
      );
    } finally {
      setLoading(false);
    }
  }
  const field =
    "mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal outline-none focus:border-moss focus:ring-2 focus:ring-moss/20";
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-pine/60 backdrop-blur-sm sm:place-items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-title"
        className="max-h-[100dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-limestone p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
              Invitér andre
            </p>
            <h2
              id="create-session-title"
              className="mt-1 text-2xl font-extrabold"
            >
              Ny session
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Luk"
          >
            <X size={20} />
          </Button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm font-extrabold">
            Titel
            <input
              required
              name="title"
              className={field}
              placeholder="F.eks. Fredagsbouldering"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
            <label className="block min-w-0 text-sm font-extrabold">
              Dato
              <input
                required
                name="date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                className={field}
              />
            </label>
            <label className="block min-w-0 text-sm font-extrabold">
              Tid
              <input required name="time" type="time" className={field} />
            </label>
          </div>
          <label className="block text-sm font-extrabold">
            Sted
            <select
              required
              name="locationId"
              className={field}
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setProjectId("");
              }}
            >
              <option value="" disabled>
                Vælg et klatrested
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} · {location.region}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-extrabold">
            Projekt <span className="font-semibold text-muted">(valgfrit)</span>
            <select
              name="projectId"
              className={field}
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              <option value="">Ingen – fri klatring</option>
              {eligibleProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} · {project.grade}
                </option>
              ))}
            </select>
            {selectedLocation && eligibleProjects.length === 0 && (
              <span className="mt-2 block text-xs font-semibold text-muted">
                Du har ingen aktive projekter i denne hal.
              </span>
            )}
          </label>
          {connections.length > 0 && (
            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-extrabold">
                <UserPlus size={16} />
                Invitér forbindelser{" "}
                <span className="font-semibold text-muted">(valgfrit)</span>
              </legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-line bg-sand p-3">
                {connections.map((connection) => (
                  <label
                    key={connection.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-limestone p-3 text-sm font-bold"
                  >
                    <input
                      type="checkbox"
                      name="inviteeIds"
                      value={connection.id}
                      className="h-4 w-4 accent-pine"
                    />
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-pine text-[10px] text-limestone">
                      {connection.initials}
                    </span>
                    <span>
                      {connection.name}
                      <small className="block font-semibold text-muted">
                        @{connection.username}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || locations.length === 0}
            className="w-full"
          >
            <Share2 size={17} />
            {loading ? "Opretter…" : "Opret session og invitér"}
          </Button>
          {locations.length === 0 && (
            <p className="text-center text-sm font-semibold text-muted">
              Der er ingen klatresteder at vælge endnu.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
