"use client";
/* eslint-disable @next/next/no-img-element -- File previews use browser object URLs. */
import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { User } from "@/types";
import { Button } from "./ui/Button";

function ImagePicker({ name, label, current, onSelected }: { name: string; label: string; current?: string; onSelected: (file: File | undefined) => void }) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState(current);
  useEffect(() => {
    if (!file) { setPreview(current); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, current]);
  return <label className="block text-sm font-bold text-ink">{label}
    {preview && <img src={preview} alt={`Forhåndsvisning af ${label.toLowerCase()}`} className={`mt-2 object-cover ${name === "avatar" ? "h-20 w-20 rounded-full" : "h-28 w-full rounded-xl"}`} />}
    <input name={name} aria-label={label} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const selected = event.target.files?.[0]; setFile(selected); onSelected(selected); }} className="mt-2 block w-full text-sm font-normal" />
  </label>;
}

export function EditProfileModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (user: User) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File>();
  const [coverFile, setCoverFile] = useState<File>();
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [onClose, loading]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (avatarFile) form.set("avatar", avatarFile, avatarFile.name);
    else form.delete("avatar");
    if (coverFile) form.set("cover", coverFile, coverFile.name);
    else form.delete("cover");
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Profilen kunne ikke gemmes.");
      onSaved(result.user);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Profilen kunne ikke gemmes."); }
    finally { setLoading(false); }
  }
  const inputClass = "mt-1 w-full rounded-xl border border-line bg-sand p-3 font-normal outline-none focus:border-moss focus:ring-2 focus:ring-moss/20";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-pine/55 p-3 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !loading) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-limestone p-5 sm:p-7">
      <div className="flex items-center justify-between"><h2 id="edit-profile-title" className="text-xl font-extrabold text-ink">Redigér profil</h2><Button variant="ghost" size="icon" disabled={loading} onClick={onClose} aria-label="Luk profilredigering"><X size={20} /></Button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <fieldset disabled={loading} className="space-y-4">
          <label className="block text-sm font-bold text-ink">Navn<input name="name" required maxLength={100} defaultValue={user.name} className={inputClass} autoFocus /></label>
          <label className="block text-sm font-bold text-ink">Brugernavn<input name="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" defaultValue={user.username} className={inputClass} /></label>
          <label className="block text-sm font-bold text-ink">By<input name="location" maxLength={100} defaultValue={user.location} className={inputClass} /></label>
          <label className="block text-sm font-bold text-ink">Beskrivelse<textarea aria-label="Beskrivelse" name="bio" rows={3} maxLength={500} defaultValue={user.bio || ""} className={inputClass} placeholder="Fortæl lidt om dig selv og din klatring" /></label>
          <ImagePicker name="avatar" label="Profilbillede" current={user.avatar} onSelected={setAvatarFile} />
          <ImagePicker name="cover" label="Baggrundsbillede" current={user.coverImage} onSelected={setCoverFile} />
          <p className="text-xs text-muted">JPG, PNG eller WebP. Højst 8 MB pr. billede.</p>
        </fieldset>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? "Gemmer…" : "Gem profil"}</Button>
      </form>
    </section>
  </div>;
}
