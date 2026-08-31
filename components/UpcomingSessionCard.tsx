import Link from "next/link";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { ClimbingSession } from "@/types";

export function UpcomingSessionCard({ session }: { session: ClimbingSession }) {
  return <section aria-labelledby="session-title" className="overflow-hidden rounded-[24px] bg-pine p-5 text-limestone shadow-soft">
    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#bcc8ba]">Kommende klatring</p>
    <div className="mt-4 flex gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-limestone text-center text-pine"><span><strong className="block text-2xl leading-6">{new Date(`${session.date}T12:00:00`).getDate()}</strong><small className="text-[9px] font-extrabold uppercase">{new Intl.DateTimeFormat("da-DK", { month: "short" }).format(new Date(`${session.date}T12:00:00`))}</small></span></div><div><h2 id="session-title" className="font-extrabold">{session.title}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-[#d2d9d0]"><Clock size={13} />{session.time}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#d2d9d0]"><MapPin size={13} />{session.location}</p></div></div>
    <div className="mt-5 flex items-center"><div className="flex -space-x-2">{session.participants.slice(0, 4).map(user => <span key={user.id} aria-label={user.name} className="grid h-8 w-8 place-items-center rounded-full bg-moss text-[10px] font-extrabold ring-2 ring-pine">{user.initials}</span>)}</div><span className="ml-3 text-xs text-[#d2d9d0]">{session.participants.length} deltagere</span><Link href={`/session/${session.shareId}`} className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-full border border-limestone/20 bg-limestone/10 px-3 text-sm font-bold text-limestone">Detaljer <ArrowUpRight size={14} /></Link></div>
  </section>;
}
