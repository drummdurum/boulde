"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  MapPin,
  Mountain,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import type { ClimbingSession, SessionInvitee } from "@/types";
import { Button } from "./ui/Button";
import { SessionPlanning } from "./SessionPlanning";
import type { ClimbingProject } from "@/types";
import type { Place } from "@/lib/places";

export function SharedSessionPage({
  initialSession,
  connections = [],
  projects = [],
  locations = [],
}: {
  initialSession: ClimbingSession;
  connections?: SessionInvitee[];
  projects?: ClimbingProject[];
  locations?: Place[];
}) {
  const [session, setSession] = useState(initialSession);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const isHost = initialSession.viewerRole === "host";
  useEffect(() => {
    let timer: number | undefined;
    let active = true;
    let loading = false;
    async function refresh() {
      if (loading || document.hidden) return;
      loading = true;
      try {
        const response = await fetch(
          `/api/sessions/${initialSession.shareId}`,
          { cache: "no-store" },
        );
        if (response.ok) {
          const next = (await response.json()).session as ClimbingSession;
          if (active)
            setSession((current) =>
              JSON.stringify(current) === JSON.stringify(next) ? current : next,
            );
        }
      } catch {
      } finally {
        loading = false;
      }
    }
    function start() {
      if (timer === undefined) timer = window.setInterval(refresh, 3000);
    }
    function stop() {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    }
    function visibilityChanged() {
      if (document.hidden) stop();
      else {
        void refresh();
        start();
      }
    }
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [initialSession.shareId]);
  async function join(event: FormEvent) {
    event.preventDefault();
    setJoining(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${session.shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSession(result.session);
      setJoined(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Du kunne ikke tilmeldes.",
      );
    } finally {
      setJoining(false);
    }
  }
  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  async function invite() {
    setInviting(true);
    setInviteMessage("");
    try {
      const response = await fetch(
        `/api/sessions/${session.shareId}/invitation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteeIds: selectedInvitees }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setInviteMessage(
        `${result.invited} invitation${result.invited === 1 ? "" : "er"} sendt.`,
      );
      setSelectedInvitees([]);
    } catch (caught) {
      setInviteMessage(
        caught instanceof Error
          ? caught.message
          : "Invitationerne kunne ikke sendes.",
      );
    } finally {
      setInviting(false);
    }
  }
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:ml-[238px] lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-pine text-limestone">
            <Mountain size={23} />
          </span>
          <span className="text-2xl font-extrabold tracking-[-.04em] text-pine">
            Boulde
          </span>
        </div>
        <section className="overflow-hidden rounded-[30px] border border-line bg-limestone shadow-soft">
          <header className="bg-pine p-6 text-limestone sm:p-9">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-limestone/60">
              {isHost ? "Din session" : "Du er inviteret"}
            </p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {session.title}
                </h1>
                <p className="mt-2 text-sm font-semibold text-limestone/70">
                  Arrangeret af {session.host.name}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copy}
                className="shrink-0 border-limestone/20 bg-limestone/10 text-limestone"
              >
                <Copy size={15} />
                {copied ? "Kopieret" : "Del"}
              </Button>
            </div>
          </header>
          <div className="p-6 sm:p-9">
            <SessionPlanning session={session} projects={projects} locations={locations} onUpdated={setSession} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Info
                icon={CalendarDays}
                label="Dato"
                value={new Intl.DateTimeFormat("da-DK", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(`${session.date}T12:00:00`))}
              />
              <Info icon={Clock} label="Tid" value={session.time} />
              <Info icon={MapPin} label="Sted" value={session.location} />
              {session.project &&
                (session.project.visible ? (
                  <Link
                    href={`/projekter/${session.project.id}`}
                    className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                  >
                    <Info
                      icon={Target}
                      label="Offentligt projekt · åbn"
                      value={`${session.project.name} · ${session.project.grade}${session.project.colorGrade ? ` · ${session.project.colorGrade}` : ""}`}
                    />
                  </Link>
                ) : (
                  <Info
                    icon={Target}
                    label="Projekt"
                    value={`${session.project.name} · ${session.project.grade}${session.project.colorGrade ? ` · ${session.project.colorGrade}` : ""}`}
                  />
                ))}
            </div>
            {isHost && (
              <div className="mt-6 rounded-[22px] border border-line bg-sand p-4">
                <h2 className="flex items-center gap-2 font-extrabold">
                  <UserPlus size={18} />
                  Invitér forbindelser
                </h2>
                {connections.length ? (
                  <>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {connections.map((connection) => (
                        <label
                          key={connection.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl bg-limestone p-3 text-sm font-bold"
                        >
                          <input
                            type="checkbox"
                            checked={selectedInvitees.includes(connection.id)}
                            onChange={(event) =>
                              setSelectedInvitees((current) =>
                                event.target.checked
                                  ? [...current, connection.id]
                                  : current.filter(
                                      (id) => id !== connection.id,
                                    ),
                              )
                            }
                            className="h-4 w-4 accent-pine"
                          />
                          <span>
                            {connection.name}
                            <small className="block font-semibold text-muted">
                              @{connection.username}
                            </small>
                          </span>
                        </label>
                      ))}
                    </div>
                    <Button
                      onClick={invite}
                      disabled={inviting || !selectedInvitees.length}
                      className="mt-3"
                    >
                      <UserPlus size={16} />
                      {inviting ? "Sender…" : "Send invitation"}
                    </Button>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-muted">
                    Du har ingen accepterede forbindelser at invitere endnu.
                  </p>
                )}
                {inviteMessage && (
                  <p
                    role="status"
                    className="mt-3 text-sm font-bold text-muted"
                  >
                    {inviteMessage}
                  </p>
                )}
              </div>
            )}
            <div className="my-7 border-t border-line" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
                  Opdateres live
                </p>
                <h2 className="mt-1 text-xl font-extrabold">
                  {session.participants.length} deltagere
                </h2>
              </div>
              <Users className="text-moss" />
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {session.participants.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-2xl bg-sand p-3"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-clay text-xs font-extrabold text-white">
                    {person.initials}
                  </span>
                  <span className="font-extrabold">{person.name}</span>
                  {person.id === session.host.id && (
                    <span className="ml-auto text-[10px] font-extrabold uppercase text-muted">
                      Vært
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!isHost &&
              (joined ? (
                <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#e4eee5] p-4 font-extrabold text-positive">
                  <Check size={19} />
                  Du er med!
                </p>
              ) : (
                <form
                  onSubmit={join}
                  className="mt-6 rounded-[22px] border border-line p-4 sm:flex sm:items-end sm:gap-3"
                >
                  <label className="block flex-1 text-sm font-extrabold">
                    Vil du med?
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      minLength={2}
                      maxLength={60}
                      className="mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal outline-none focus:border-moss"
                      placeholder="Dit navn"
                    />
                  </label>
                  <Button
                    type="submit"
                    disabled={joining}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    {joining ? "Tilmelder…" : "Jeg er med"}
                  </Button>
                  {error && (
                    <p
                      role="alert"
                      className="mt-2 text-sm font-bold text-red-700 sm:absolute"
                    >
                      {error}
                    </p>
                  )}
                </form>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-sand p-4">
      <Icon size={19} className="mt-0.5 shrink-0 text-clay" />
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-extrabold capitalize">{value}</p>
      </div>
    </div>
  );
}
