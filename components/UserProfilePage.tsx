import Image from "next/image";
import { CalendarDays, CheckCircle2, MapPin, Mountain, Pencil, Settings, Target } from "lucide-react";
import type { User } from "@/types";
import type { ClimbingProject, Post } from "@/types";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

export function UserProfilePage({ user, createdAt, posts, projects, followCounts }: { user: User; createdAt: string; posts: Post[]; projects: ClimbingProject[]; followCounts: { followers: number; following: number } }) {
  const memberSince = new Intl.DateTimeFormat("da-DK", { month: "long", year: "numeric" }).format(new Date(createdAt));
  const stats = [
    ["0", "Gennemførte", CheckCircle2],
    ["—", "Højeste grade", Mountain],
    [String(projects.filter(project => project.status !== "Gennemført").length), "Aktive projekter", Target],
    ["0", "Klatresteder", MapPin]
  ] as const;

  return <main className="min-h-screen px-4 pb-28 pt-5 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10">
    <div className="mx-auto max-w-[1180px]">
      <header className="mb-5 flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">Din profil</p><h1 className="mt-1 text-2xl font-extrabold tracking-[-.03em] text-ink">Profil</h1></div><Button variant="outline" size="icon" aria-label="Profilindstillinger"><Settings size={19} /></Button></header>
      <section aria-labelledby="profile-name" className="overflow-hidden rounded-[28px] border border-line bg-limestone shadow-soft">
        <div className="relative h-36 overflow-hidden bg-pine sm:h-48"><Image src="/images/nordic-boulder.png" alt="Granitblokke i en nordisk skov" fill priority className="object-cover object-[center_42%] opacity-70" /><div className="absolute inset-0 bg-gradient-to-r from-pine/65 to-transparent" /></div>
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-end gap-4"><span className="rounded-full bg-limestone p-1.5"><Avatar user={user} size="lg" /></span><div className="pb-1"><h2 id="profile-name" className="text-2xl font-extrabold tracking-tight text-ink">{user.name}</h2><p className="text-sm font-semibold text-muted">@{user.username}</p></div></div><Button variant="outline"><Pencil size={16} />Redigér profil</Button></div>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-muted">Din profil er ny. Tilføj en beskrivelse, når profilredigering bliver aktiveret.</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">{user.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{user.location}</span>}<span className="flex items-center gap-1.5 capitalize"><CalendarDays size={14} />Medlem siden {memberSince}</span></div>
          <div className="mt-6 flex gap-6 border-t border-line pt-5 text-sm"><span><strong className="block text-lg text-ink">{followCounts.followers}</strong><span className="text-muted">Følgere</span></span><span><strong className="block text-lg text-ink">{followCounts.following}</strong><span className="text-muted">Følger</span></span></div>
        </div>
      </section>
      <section aria-label="Profilstatistik" className="my-5 grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([value, label, Icon]) => <article key={label} className="rounded-[20px] border border-line bg-limestone p-4 shadow-soft"><Icon className="text-moss" size={18} /><strong className="mt-4 block text-2xl text-ink">{value}</strong><span className="text-xs font-semibold text-muted">{label}</span></article>)}</section>
      <section className="grid min-h-72 place-items-center rounded-[26px] border border-dashed border-line bg-limestone p-8 text-center"><div><Mountain className="mx-auto text-moss" size={32} /><h2 className="mt-4 text-xl font-extrabold text-ink">{posts.length ? `${posts.length} opslag på din profil` : "Ingen klatrehistorik endnu"}</h2><p className="mt-2 text-sm font-semibold text-muted">{posts.length ? "Dine opslag er gemt og vises på dashboardet." : "Dine egne opslag og gennemførte klatringer kommer til at ligge her."}</p></div></section>
    </div>
  </main>;
}
