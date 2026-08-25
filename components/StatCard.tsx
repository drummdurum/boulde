import type { LucideIcon } from "lucide-react";
export function StatCard({ label, value, change, icon: Icon, tone = "pine" }: { label: string; value: string; change: string; icon: LucideIcon; tone?: "pine" | "clay" | "ochre" | "moss" }) {
  const tones = { pine: "bg-pine/10 text-pine", clay: "bg-clay/10 text-clay", ochre: "bg-ochre/15 text-[#795520]", moss: "bg-moss/15 text-moss" };
  return <article className="rounded-[22px] border border-line/80 bg-limestone p-4 shadow-soft">
    <div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={18} /></span><span className="rounded-full bg-[#e7eee6] px-2 py-1 text-[10px] font-extrabold text-positive">{change}</span></div>
    <p className="mt-5 text-2xl font-extrabold tracking-tight text-ink">{value}</p><p className="mt-1 text-xs font-semibold text-muted">{label}</p>
  </article>;
}
