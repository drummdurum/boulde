import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import type { ClimbingSpot } from "@/types";
import { Button } from "./ui/Button";

export function ClimbingSpots({ spots }: { spots: ClimbingSpot[] }) {
  return <section aria-labelledby="spots-title">
    <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">I nærheden</p><h2 id="spots-title" className="mt-1 text-xl font-extrabold text-ink">Populære steder</h2></div><Button variant="ghost" size="sm" aria-label="Se alle klatresteder"><ArrowRight size={17} /></Button></div>
    <div className="space-y-3">{spots.map((spot, index) => <article key={spot.id} className="flex items-center gap-3 rounded-[20px] border border-line bg-limestone p-2.5 shadow-soft"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"><Image src={spot.image} alt={spot.imageAlt} fill sizes="80px" className={`object-cover ${index === 1 ? "object-left" : index === 2 ? "object-right" : ""}`} /></div><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-ink">{spot.name}</h3><p className="mt-1 flex items-center gap-1 text-[11px] text-muted"><MapPin size={11} />{spot.area}</p><p className="mt-2 text-[11px] font-bold text-moss">{spot.type} · {spot.routes} ruter</p></div></article>)}</div>
  </section>;
}
