"use client";
import { FormEvent, useEffect, useState } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import type { Post } from "@/types";
import { Button } from "./ui/Button";

export function CreatePostModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (post: Post) => void }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = previousOverflow; };
  }, [open, onClose]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Opslaget kunne ikke gemmes.");
      onCreated?.(result.post); onClose();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Opslaget kunne ikke gemmes."); }
    finally { setLoading(false); }
  }
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-pine/55 p-3 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="create-title" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[24px] bg-limestone p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:p-7">
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 flex items-center justify-between border-b border-line/70 bg-limestone/95 px-4 py-3 backdrop-blur sm:-top-7 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pb-3 sm:pt-7"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-clay sm:text-xs">Del din klatring</p><h2 id="create-title" className="text-xl font-extrabold text-ink sm:mt-1 sm:text-2xl">Opret opslag</h2></div><Button onClick={onClose} variant="ghost" size="icon" aria-label="Luk dialog" className="h-10 w-10"><X size={20} /></Button></div>
      <form onSubmit={submit}><label className="mt-4 block text-sm font-extrabold text-ink sm:mt-6">Hvad skete der?<textarea name="description" required autoFocus rows={3} className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-sand p-3 font-normal outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 sm:mt-2 sm:p-4" placeholder="Fortæl om ruten, cruxet eller følelsen…" /></label>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3"><label className="min-w-0 text-sm font-extrabold text-ink">Rute<input name="route" required className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-line bg-sand px-3 font-normal outline-none focus:border-moss sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4" placeholder="Rutens navn" /></label><label className="min-w-0 text-sm font-extrabold text-ink">Sted<input name="location" required className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-line bg-sand px-3 font-normal outline-none focus:border-moss sm:mt-2 sm:h-11 sm:rounded-2xl sm:px-4" placeholder="Klatrested" /></label></div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3"><label className="min-w-0 text-sm font-extrabold text-ink">Grade<select name="grade" className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-line bg-sand px-3 font-normal sm:mt-2 sm:h-11 sm:rounded-2xl">{["5+","6A","6B","6C","7A","7A+","7B","7C","8A"].map(grade => <option key={grade}>{grade}</option>)}</select></label><label className="min-w-0 text-sm font-extrabold text-ink">Type<select name="type" className="mt-1.5 h-10 w-full min-w-0 rounded-xl border border-line bg-sand px-3 font-normal sm:mt-2 sm:h-11 sm:rounded-2xl"><option>Boulder</option><option>Sportsklatring</option><option>Indendørs</option></select></label></div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3"><Button type="button" variant="outline" size="sm"><ImagePlus size={17} />Billede</Button><Button type="button" variant="outline" size="sm"><Video size={17} />Video</Button></div>
      <p className="mt-3 text-[11px] leading-4 text-muted sm:mt-4 sm:text-xs sm:leading-5">Opslaget gemmes på din profil. Medie-upload kommer i næste trin.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="mt-4 w-full sm:mt-6">{loading ? "Gemmer…" : "Gem opslag"}</Button></form>
    </section>
  </div>;
}
