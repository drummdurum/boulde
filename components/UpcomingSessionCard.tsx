import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { ClimbingSession } from "@/types";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

export function UpcomingSessionCard({ session }: { session: ClimbingSession }) {
  return <section aria-labelledby="session-title" className="overflow-hidden rounded-[24px] bg-pine p-5 text-limestone shadow-soft">
    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#bcc8ba]">Kommende klatring</p>
    <div className="mt-4 flex gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-limestone text-center text-pine"><span><strong className="block text-2xl leading-6">{session.date}</strong><small className="text-[9px] font-extrabold uppercase">{session.day}</small></span></div><div><h2 id="session-title" className="font-extrabold">Lørdag på granitten</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-[#d2d9d0]"><Clock size={13} />{session.time}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#d2d9d0]"><MapPin size={13} />{session.location}</p></div></div>
    <div className="mt-5 flex items-center"><div className="flex -space-x-2">{session.participants.map(user => <Avatar key={user.id} user={user} size="sm" />)}</div><span className="ml-3 text-xs text-[#d2d9d0]">{session.participants.length} deltagere</span><Button variant="outline" size="sm" className="ml-auto border-limestone/20 bg-limestone/10 text-limestone hover:border-limestone">Detaljer <ArrowUpRight size={14} /></Button></div>
  </section>;
}
