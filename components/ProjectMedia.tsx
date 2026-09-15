"use client";
/* eslint-disable @next/next/no-img-element -- signed object-storage URLs are dynamic. */
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Camera, Upload, Video, X } from "lucide-react";
import type { ClimbingProject, ProjectMedia } from "@/types";
import { Button } from "./ui/Button";

export function ProjectMediaPanel({
  projectId,
  version = 0,
  onNewAttempt,
  attempts = 0,
  note = "",
  progress = 0,
  status = "",
}: {
  projectId: string;
  version?: number;
  onNewAttempt?: () => void;
  attempts?: number;
  note?: string;
  progress?: number;
  status?: string;
}) {
  const [media, setMedia] = useState<ProjectMedia[]>([]);
  useEffect(() => {
    fetch(`/api/projects/${projectId}/media`)
      .then((response) => (response.ok ? response.json() : { media: [] }))
      .then((result) =>
        setMedia(Array.isArray(result.media) ? result.media : []),
      )
      .catch(() => setMedia([]));
  }, [projectId, version]);
  return (
    <section
      className="mt-4 rounded-[24px] border border-line bg-limestone p-5 shadow-soft"
      aria-labelledby="uploaded-media-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">Visuel arbejdslog</p>
          <h2 id="uploaded-media-title" className="mt-1 text-xl font-extrabold">Seneste forsøg</h2>
        </div>
      </div>
      {!media.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line bg-sand/50 p-6 text-center">
          {attempts ? <>
            <div className="flex items-center justify-between text-left text-xs font-extrabold text-muted">
              <span>Forsøg #{attempts}</span><span>{status}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-ochre" style={{ width: `${progress ?? 0}%` }} /></div>
            <p className="mt-3 text-left text-sm font-semibold leading-6 text-muted">{note || "Forsøget blev gemt uden en note eller et medie."}</p>
          </> : <>
            <Camera className="mx-auto text-clay" size={24} />
            <p className="mt-2 text-sm font-extrabold">Start din arbejdslog</p>
            <p className="mt-1 text-sm text-muted">Gem et billede, en video eller en kort note efter dit næste forsøg.</p>
          </>}
          {onNewAttempt && <Button onClick={onNewAttempt} variant="outline" className="mt-4">{attempts ? "Log næste forsøg" : "Log første forsøg"}</Button>}
        </div>
      ) : (
        <div className="relative mt-5 space-y-4 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-line">
          {media.map((item, index) => (
            <article key={item.id} className="relative grid grid-cols-[20px_1fr] gap-3">
              <span className="z-10 mt-2 h-2.5 w-2.5 rounded-full bg-ochre ring-4 ring-limestone" />
              <div className="overflow-hidden rounded-2xl border border-line bg-sand">
                <div className="flex items-center justify-between px-4 pt-3 text-xs font-extrabold text-muted">
                  <span>Forsøg #{media.length - index}</span>
                  <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}</time>
                </div>
                {item.type === "video" ? <video src={item.url} controls playsInline preload="none" className="mt-3 aspect-video w-full object-cover" aria-label={item.note || "Video fra projektet"} /> : <img src={item.url} alt={item.note || "Billede fra projektet"} loading="lazy" decoding="async" className="mt-3 aspect-video w-full object-cover" />}
                {item.note && <p className="p-4 text-sm font-semibold leading-6 text-muted">{item.note}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function MediaUploadModal({
  project,
  onClose,
  onSaved,
}: {
  project: ClimbingProject;
  onClose: () => void;
  onSaved: (project: ClimbingProject) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState(project.note);
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState(project.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) setFiles(Array.from(event.target.files));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      for (const file of files) {
        const mediaUpload = new FormData();
        mediaUpload.set("file", file);
        mediaUpload.set("note", note);
        const upload = await fetch(`/api/projects/${project.id}/media`, {
          method: "POST",
          body: mediaUpload,
        });
        const uploaded = await upload.json();
        if (!upload.ok) throw new Error(uploaded.error || "Filen kunne ikke uploades.");
      }
      const values = new FormData();
      values.set("id", project.id);
      values.set("progress", String(progress));
      values.set("status", status);
      values.set("note", note);
      values.set("attempt", String(files.length === 0));
      const update = await fetch("/api/projects", {
        method: "PATCH",
        body: values,
      });
      const updated = await update.json();
      if (!update.ok || !updated.project)
        throw new Error(updated.error || "Fremskridtet kunne ikke gemmes.");
      onSaved(updated.project);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Mediet kunne ikke gemmes.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-pine/60 backdrop-blur-sm sm:place-items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-upload-title"
        className="w-full max-w-xl rounded-t-[28px] bg-limestone p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
              {project.name}
            </p>
            <h2
              id="media-upload-title"
              className="mt-1 text-2xl font-extrabold"
            >
              Nyt forsøg
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Luk"
          >
            <X size={20} />
          </Button>
        </div>
        <form onSubmit={submit}>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-moss bg-sand text-sm font-extrabold">
              <Camera size={22} />
              Billede
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={addFiles}
                className="sr-only"
                aria-label="Vælg billede"
              />
            </label>
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-moss bg-sand text-sm font-extrabold">
              <Video size={22} />
              Video
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={addFiles}
                className="sr-only"
                aria-label="Vælg video"
              />
            </label>
          </div>
          {files.length > 0 && (
            <p className="mt-3 text-sm font-bold text-positive">
              {files.map((file) => file.name).join(", ")}
            </p>
          )}
          <label className="mt-4 block text-sm font-extrabold">
            Fremskridt: <output>{progress}%</output>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="mt-3 w-full accent-clay"
              aria-label="Fremskridt i procent"
            />
          </label>
          <label className="mt-4 block text-sm font-extrabold">
            Status
            <select
              value={status}
              onChange={(event) =>
                (setStatus(event.target.value as ClimbingProject["status"]), event.target.value === "Gennemført" && setProgress(100))
              }
              className="mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal"
            >
              {["Ny", "Arbejder på den", "Tæt på", "Gennemført"].map(
                (option) => (
                  <option key={option}>{option}</option>
                ),
              )}
            </select>
          </label>
          <label className="mt-4 block text-sm font-extrabold">
            Note <span className="font-semibold text-muted">(valgfri)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-line bg-sand p-4 font-normal"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="mt-5 w-full">
            <Upload size={17} />
            {loading ? "Uploader…" : "Gem forsøg"}
          </Button>
        </form>
      </section>
    </div>
  );
}
