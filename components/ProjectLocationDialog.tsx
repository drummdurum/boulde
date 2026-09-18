"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import type { ClimbingProject } from "@/types";
import { gymMapForPlace } from "@/lib/gym-maps";
import { GymMap } from "./gym-map/GymMap";

export function ProjectLocationDialog({ project, onClose }: { project: ClimbingProject; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const map = gymMapForPlace(project.placeSlug);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  if (!map || !project.mapPlacement) return null;

  return <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={onClose} onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-[28px] border border-line bg-limestone p-5 text-ink shadow-soft backdrop:bg-pine/60 sm:p-7">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-clay">Placering i hallen</p><h2 id={titleId} data-no-translate className="mt-1 text-xl font-extrabold">{project.name}</h2><p data-no-translate className="mt-2 text-sm font-semibold text-muted">{project.location} · {project.colorGrade ?? project.grade} · {project.owner?.name}</p></div><button type="button" onClick={onClose} aria-label="Luk kort" className="rounded-full border border-line p-2 hover:bg-sand"><X size={20} /></button></div>
    <GymMap {...map} placement={project.mapPlacement} />
    <Link href={`/projekter/${project.id}`} className="mt-5 inline-flex rounded-xl bg-pine px-4 py-3 text-sm font-extrabold text-limestone">Åbn projekt</Link>
    <Link href={`/steder/${project.placeSlug}`} className="ml-4 inline-flex text-sm font-extrabold text-pine">Se hallen</Link>
  </dialog>;
}
