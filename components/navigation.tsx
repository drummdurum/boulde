"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LayoutGrid, MapPinned, Mountain, Settings, Target, UserRound, Users } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";

const items = [
  { label: "Dashboard", icon: LayoutGrid, href: "/" },
  { label: "Klatrere", icon: Users, href: "/klatrere" },
  { label: "Mine projekter", icon: Target, href: "/projekter" },
  { label: "Klatresteder", icon: MapPinned, href: "/steder" },
  { label: "Gemte opslag", icon: Bookmark, href: "#" },
  { label: "Profil", icon: UserRound, href: "/profil" },
  { label: "Indstillinger", icon: Settings, href: "#" }
] as const;

function isActive(pathname: string, href: string) { return href !== "#" && (href === "/" ? pathname === "/" : pathname.startsWith(href)); }
export function AppSidebar({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  if (!authenticated || pathname === "/login" || pathname === "/opret") return null;
  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] border-r border-line bg-limestone px-5 py-7 lg:flex lg:flex-col">
    <Link href="/" className="mb-10 flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"><span className="grid h-11 w-11 place-items-center rounded-[15px] bg-pine text-limestone"><Mountain size={23} /></span><span className="text-2xl font-extrabold tracking-[-.04em] text-pine">Boulde</span></Link>
    <nav aria-label="Primær navigation" className="space-y-1">{items.map(({ label, icon: Icon, href }) => { const active = isActive(pathname, href); return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay ${active ? "bg-pine text-limestone shadow-soft" : "text-muted hover:bg-sand hover:text-ink"}`}><Icon size={19} /><span>{label}</span></Link>; })}</nav>
    <AuthNavigation />
  </aside>;
}
export function MobileNavigation({ authenticated }: { authenticated: boolean }) {
  const pathname = usePathname();
  if (!authenticated || pathname === "/login" || pathname === "/opret") return null;
  const mobile = [items[0], items[1], items[2], items[3], items[5]];
  return <nav aria-label="Mobilnavigation" className="fixed inset-x-0 bottom-0 z-40 flex h-[74px] items-center justify-around border-t border-line bg-limestone/95 px-2 backdrop-blur lg:hidden">{mobile.map(({ label, icon: Icon, href }) => { const active = isActive(pathname, href); return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay ${active ? "text-pine" : "text-muted"}`}><Icon size={20} fill={active ? "currentColor" : "none"} /><span>{label === "Mine projekter" ? "Projekter" : label === "Klatresteder" ? "Steder" : label}</span></Link>; })}</nav>;
}
