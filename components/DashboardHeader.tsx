import { Bell, Plus, Search } from "lucide-react";
import type { User } from "@/types";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

export function DashboardHeader({ user, onCreate }: { user: User; onCreate: () => void }) {
  return <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
    <div>
      <p className="mb-1 text-sm font-bold text-clay">God onsdag, {user.name.split(" ")[0]}</p>
      <h1 className="text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Klar til næste problem?</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Din profil er klar. Her får du overblik over dine projekter, opslag og klatrehistorik.</p>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <label className="relative min-w-0 flex-1 xl:w-60">
        <span className="sr-only">Søg efter klatrere og steder</span>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input type="search" placeholder="Søg i Boulde" className="h-11 w-full rounded-full border border-line bg-limestone pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-moss focus:ring-2 focus:ring-moss/20" />
      </label>
      <Button variant="outline" size="icon" aria-label="Notifikationer" className="relative shrink-0"><Bell size={19} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-clay ring-2 ring-limestone" /></Button>
      <Avatar user={user} />
      <Button onClick={onCreate} className="hidden shrink-0 sm:inline-flex"><Plus size={18} />Opret opslag</Button>
    </div>
    <Button onClick={onCreate} className="sm:hidden"><Plus size={18} />Opret opslag</Button>
  </header>;
}
