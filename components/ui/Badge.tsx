import type { ReactNode } from "react";
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "positive" | "warm" }) {
  const styles = { neutral: "bg-sand text-muted", positive: "bg-[#e4eee5] text-positive", warm: "bg-[#f4e7d2] text-[#7b571f]" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${styles[tone]}`}>{children}</span>;
}
