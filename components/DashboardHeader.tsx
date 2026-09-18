"use client";

import Link from "next/link";
import { useRef } from "react";
import { Bell, MapPinned, Plus, Search, UserRound } from "lucide-react";
import type { User } from "@/types";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

export function DashboardHeader({ user, onCreate, notificationCount = 0 }: { user: User; onCreate: () => void; notificationCount?: number }) {
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  return <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
    <div>
      <p className="mb-1 text-sm font-bold text-clay">God onsdag, {user.name.split(" ")[0]}</p>
      <h1 className="text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Klar til næste problem?</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Din profil er klar. Her får du overblik over dine projekter, opslag og klatrehistorik.</p>
    </div>
    <div className="flex items-start gap-2 sm:gap-3">
      <div className="min-w-0 flex-1 xl:w-60">
        <label className="relative block">
          <span className="sr-only">Søg efter klatrere og steder</span>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input type="search" placeholder="Søg i Boulde" className="h-11 w-full rounded-full border border-line bg-limestone pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-moss focus:ring-2 focus:ring-moss/20" />
        </label>
        <Link href="/klatresteder" className="mt-2 hidden min-h-10 items-center justify-center gap-2 rounded-full border border-line bg-limestone px-4 text-sm font-extrabold text-pine transition hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay sm:flex">
          <MapPinned size={17} />Klatresteder
        </Link>
      </div>
      <Button variant="outline" size="icon" aria-label={`Notifikationer${notificationCount ? ` (${notificationCount})` : ""}`} className="relative shrink-0"><Bell size={19} />{notificationCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[10px] font-extrabold text-white ring-2 ring-limestone">{notificationCount > 9 ? "9+" : notificationCount}</span>}</Button>
      <div className="hidden sm:block"><Avatar user={user} /></div>
      <details ref={mobileMenu} className="relative shrink-0 sm:hidden"
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false; }}
        onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
        <summary aria-label="Profilmenu" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full border border-line bg-limestone text-pine hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay [&::-webkit-details-marker]:hidden"><UserRound size={20} /></summary>
        <nav aria-label="Profil og genveje" className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-limestone p-2 shadow-soft">
          <Link href="/profil" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-pine hover:bg-sand"><UserRound size={18} />Min profil</Link>
          <Link href="/klatresteder" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-pine hover:bg-sand"><MapPinned size={18} />Klatresteder</Link>
          <button type="button" onClick={() => { if (mobileMenu.current) mobileMenu.current.open = false; onCreate(); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-pine hover:bg-sand"><Plus size={18} />Opret opslag</button>
        </nav>
      </details>
      <Button onClick={onCreate} className="hidden shrink-0 sm:inline-flex"><Plus size={18} />Opret opslag</Button>
    </div>
  </header>;
}
