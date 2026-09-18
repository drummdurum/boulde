/* eslint-disable @next/next/no-img-element -- Seeded location images are remote URLs managed in Neo4j. */
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, ExternalLink, MapPin, Target, UserRound } from "lucide-react";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getClimbingLocation, getPublicProjectsAtLocation } from "@/lib/locations";
import { CopenhagenSouthMap } from "@/components/gym-map/CopenhagenSouthMap";

export default async function Page({ params }: { params: { id: string } }) {
  if (!await userFromSession(cookies().get(SESSION_COOKIE)?.value)) redirect("/login");
  const location = await getClimbingLocation(params.id); if (!location) notFound();
  const projects = await getPublicProjectsAtLocation(location);
  return <main className="min-h-screen px-4 pb-28 pt-5 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10"><div className="mx-auto max-w-[1100px]">
    <Link href="/klatresteder" className="mb-5 inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink"><ArrowLeft size={17} />Alle klatresteder</Link>
    <header className="overflow-hidden rounded-[30px] border border-line bg-pine text-limestone shadow-soft"><div className="relative min-h-64"><img src={location.imageUrl} alt={location.name} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/35 to-transparent" /><div className="relative flex min-h-64 flex-col justify-end p-6 sm:p-9"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-limestone/70">{location.region} · {location.type}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] sm:text-5xl">{location.name}</h1><div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-limestone/80"><span className="flex items-center gap-2"><MapPin size={17} />{location.address}</span><span className="flex items-center gap-2"><Clock3 size={17} />{location.hours} {location.hoursNote}</span></div><a href={location.mapsUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-limestone px-4 py-2.5 text-sm font-extrabold text-pine">Åbn i Maps <ExternalLink size={16} /></a></div></div></header>
    {location.id === "sydhavn" && <CopenhagenSouthMap projects={projects} />}
    <section className="mt-9" aria-labelledby="public-projects"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">Fra fællesskabet</p><h2 id="public-projects" className="mt-1 text-2xl font-extrabold">Offentlige projekter her</h2><p className="mt-2 text-sm font-semibold text-muted">Projekter som andre klatrere har valgt at dele offentligt.</p>
      {projects.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{projects.map(project => <Link href={`/projekter/${project.id}`} key={project.id} className="rounded-[22px] border border-line bg-limestone p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-moss"><p className="flex items-center gap-2 text-xs font-extrabold text-muted"><UserRound size={15} />{project.owner?.name} · @{project.owner?.username}</p><h3 className="mt-3 text-lg font-extrabold">{project.name}</h3><div className="mt-2 flex items-center gap-2 text-sm font-bold text-muted"><Target size={15} />{project.grade} · {project.status}</div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-ochre" style={{ width: `${project.progress}%` }} /></div><p className="mt-2 text-xs font-bold text-muted">{project.progress}% · {project.attempts} forsøg</p></Link>)}</div> : <div className="mt-5 rounded-[24px] border border-dashed border-line bg-limestone p-8 text-center"><Target className="mx-auto text-clay" /><h3 className="mt-3 font-extrabold">Ingen offentlige projekter endnu</h3><p className="mt-1 text-sm font-semibold text-muted">Det første delte projekt på dette sted dukker op her.</p></div>}
    </section>
  </div></main>;
}
