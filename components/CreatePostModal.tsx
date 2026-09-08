"use client";
/* eslint-disable @next/next/no-img-element -- local object URL previews cannot use next/image. */
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Video, X } from "lucide-react";
import type { Post } from "@/types";
import { Button } from "./ui/Button";

export function CreatePostModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (post: Post) => void }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [media, setMedia] = useState<File>();
  const preview = useMemo(() => media ? URL.createObjectURL(media) : "", [media]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
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
      const values = new FormData(event.currentTarget);
      if (media) values.set("media", media);
      const response = await fetch("/api/posts", { method: "POST", body: values });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Opslaget kunne ikke gemmes.");
      onCreated?.(result.post); onClose();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Opslaget kunne ikke gemmes."); }
    finally { setLoading(false); }
  }
  function selectMedia(event: ChangeEvent<HTMLInputElement>) { setMedia(event.target.files?.[0]); event.target.value = ""; }
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-pine/55 p-3 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="create-title" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[24px] bg-limestone p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:p-7">
      <div className="sticky -top-4 z-10 -mx-4 -mt-4 flex items-center justify-between border-b border-line/70 bg-limestone/95 px-4 py-3 backdrop-blur sm:-top-7 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pb-3 sm:pt-7"><div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-clay sm:text-xs">Start en samtale</p><h2 id="create-title" className="text-xl font-extrabold text-ink sm:mt-1 sm:text-2xl">Opret opslag</h2></div><Button onClick={onClose} variant="ghost" size="icon" aria-label="Luk dialog" className="h-10 w-10"><X size={20} /></Button></div>
      <form onSubmit={submit}><label className="mt-4 block text-sm font-extrabold text-ink sm:mt-6">Hvad vil du dele?<textarea name="description" required autoFocus rows={5} className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-sand p-3 font-normal outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 sm:mt-2 sm:p-4" placeholder="Stil et spørgsmål, del en tanke eller start en diskussion…" /></label>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3"><label className="relative flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-line bg-transparent px-3 text-sm font-extrabold text-pine focus-within:ring-2 focus-within:ring-clay"><ImagePlus size={17} />Billede<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectMedia} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Vælg billede til opslag" /></label><label className="relative flex h-9 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-line bg-transparent px-3 text-sm font-extrabold text-pine focus-within:ring-2 focus-within:ring-clay"><Video size={17} />Video<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={selectMedia} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Vælg video til opslag" /></label></div>
      {media && <div className="relative mt-3 overflow-hidden rounded-2xl bg-pine">{media.type.startsWith("video/") ? <video src={preview} className="max-h-52 w-full object-contain" controls playsInline /> : <img src={preview} alt="Forhåndsvisning af medie" className="max-h-52 w-full object-contain" />}<button type="button" onClick={() => setMedia(undefined)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-pine/80 text-limestone" aria-label="Fjern valgt medie"><X size={16} /></button></div>}
      <p className="mt-3 text-[11px] leading-4 text-muted sm:mt-4 sm:text-xs sm:leading-5">Medie er valgfrit. Vil du registrere en klatring, så opret eller opdatér et projekt under Mine projekter.</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <Button type="submit" disabled={loading} className="mt-4 w-full sm:mt-6">{loading ? "Gemmer…" : "Gem opslag"}</Button></form>
    </section>
  </div>;
}
