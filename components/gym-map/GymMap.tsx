"use client";

import { useId, useState } from "react";
import type { GymMapArea } from "./copenhagen-south";
import type { MapPlacement } from "@/lib/gym-maps";
import type { ClimbingProject } from "@/types";
import { climbingColors, climbingColorStyles } from "@/lib/grading";
import Link from "next/link";

export function GymMap({ name, areas, placement, onPlacementChange, context = [], resolveSection, projects = [] }: {
  name: string; areas: GymMapArea[]; placement?: MapPlacement;
  onPlacementChange?: (placement: MapPlacement | undefined) => void;
  context?: { path: string; kind: "boundary" | "separator" }[];
  resolveSection?: (areaId: string, x: number, y: number) => string;
  projects?: ClimbingProject[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const titleId = useId();
  const detailsId = useId();
  const activeId = placement ? (resolveSection?.(placement.areaId, placement.x * 1072 / 100, placement.y * 740 / 100) ?? placement.areaId) : selectedId;
  const selected = areas.find(area => area.id === activeId);
  const markedProjects = projects.filter(project => project.mapPlacement && !project.removedAt);
  const markerProjects = markedProjects.filter((project, index, all) => all.findIndex(candidate => (candidate.mapProblemId ?? candidate.id) === (project.mapProblemId ?? project.id)) === index);
  const sectionOf = (project: ClimbingProject) => project.mapPlacement && (resolveSection?.(project.mapPlacement.areaId, project.mapPlacement.x * 1072 / 100, project.mapPlacement.y * 740 / 100) ?? project.mapPlacement.areaId);
  const sectionProjects = selected ? markedProjects.filter(project => sectionOf(project) === activeId) : markedProjects;
  const selectedProject = markedProjects.find(project => project.id === selectedProjectId);
  function chooseArea(area: GymMapArea, event?: React.MouseEvent<SVGGElement>) {
    setSelectedId(area.id);
    setSelectedProjectId(null);
    if (!onPlacementChange) return;
    let { x, y } = area.placementPoint ?? area.label;
    const svg = event?.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (event && svg && matrix) {
      const point = svg.createSVGPoint();
      point.x = event.clientX; point.y = event.clientY;
      const local = point.matrixTransform(matrix.inverse());
      x = local.x; y = local.y;
    }
    onPlacementChange({ areaId: area.id, x: Math.max(0, Math.min(100, x / 1072 * 100)), y: Math.max(0, Math.min(100, y / 740 * 100)) });
  }

  return <section className="mt-5 rounded-[28px] border border-line bg-limestone p-5 shadow-soft sm:p-8" aria-labelledby={titleId}>
    <h2 id={titleId} className="text-xl font-extrabold text-ink">Vægkort</h2>
    <p className="mt-2 text-sm font-semibold text-muted">{onPlacementChange ? "Tryk på væggen, hvor problemet ligger. Du kan flytte prikken ved at trykke igen. Placering er valgfri." : "Vælg en væg på kortet eller med knapperne nedenfor."}</p>
    <svg viewBox="0 0 1072 740" className="mt-5 block w-full rounded-[20px] bg-white" role="group" aria-label={`Vægkort over ${name}`}>
      <rect x="28" y="28" width="1012" height="684" rx="12" fill="#fafbf8" stroke="#e4e9e3" />
      {areas.map(area => <g key={area.id} data-area-id={area.id} role="button" tabIndex={0}
        aria-label={area.name} aria-pressed={activeId === area.id} aria-controls={detailsId}
        onClick={event => chooseArea(area, event)} onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseArea(area); }
        }} className="group cursor-pointer outline-none">
        <title>{area.name}{area.angle ? ` · ${area.angle}` : ""}</title>
        {(area.fillPath || area.island) && <path d={area.fillPath ?? `${area.path} Z`} fill={activeId === area.id ? "#c6e0d2" : "#e0ebe4"} className="transition-colors group-hover:fill-[#c6e0d2] group-focus-visible:fill-[#c6e0d2]" />}
        <path d={area.path} fill="none" stroke="transparent" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
        <path d={area.path} fill="none" stroke={activeId === area.id ? "#9fc8b5" : "#cfddd7"} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-[#9fc8b5] group-focus-visible:stroke-[#9fc8b5]" />
        <path d={area.path} fill="none" stroke={activeId === area.id ? "#244a3a" : "#536f64"} strokeWidth={activeId === area.id ? 4 : 2} strokeLinecap="round" strokeLinejoin="round" className="group-focus-visible:stroke-[5px]" />
        <text x={area.label.x} y={area.label.y} textAnchor="middle" fill="#283a39" fontSize="15" fontWeight="700">{area.shortLabel ?? area.name}</text>
      </g>)}
      <g pointerEvents="none" aria-hidden="true">
        {context.map((line, index) => <path key={index} d={line.path} fill="none" stroke={line.kind === "boundary" ? "#b9c0b8" : "#8b9c90"} strokeWidth={line.kind === "boundary" ? 2 : 2.5} strokeDasharray={line.kind === "separator" ? "4 4" : undefined} />)}
      </g>
      {markerProjects.map(project => <g key={project.id} role="button" tabIndex={0} aria-label={`${project.name} · ${project.colorGrade ?? project.grade} · ${project.owner?.name ?? "Mit projekt"}`}
        onClick={() => { setSelectedProjectId(project.id); setSelectedId(sectionOf(project) ?? null); }}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedProjectId(project.id); setSelectedId(sectionOf(project) ?? null); } }} className="cursor-pointer outline-none group">
        <title>{project.name} · {project.colorGrade ?? project.grade}</title>
        <circle cx={project.mapPlacement!.x * 1072 / 100} cy={project.mapPlacement!.y * 740 / 100} r="20" fill="transparent" />
        <circle cx={project.mapPlacement!.x * 1072 / 100} cy={project.mapPlacement!.y * 740 / 100} r={selectedProjectId === project.id ? 15 : 11} fill={project.colorGrade ? climbingColorStyles[project.colorGrade] : "#71827b"} stroke={selectedProjectId === project.id ? "#244a3a" : "white"} strokeWidth="4" className="group-focus-visible:stroke-[#244a3a]" />
      </g>)}
      {placement && <g pointerEvents="none" aria-label="Projektets placering">
        <circle cx={placement.x * 1072 / 100} cy={placement.y * 740 / 100} r="14" fill="#c66c43" stroke="white" strokeWidth="5" />
      </g>}
    </svg>
    <p className="mt-2 text-xs text-muted">Skematisk kort baseret på skitsen · ikke målfast</p>
    {markedProjects.length > 0 && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Projektfarver">{climbingColors.filter(color => markedProjects.some(project => project.colorGrade === color)).map(color => <span key={color} className="flex items-center gap-1.5 text-xs font-semibold text-muted"><span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: climbingColorStyles[color] }} />{color}</span>)}</div>}
    <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Vælg væg">
      {areas.map(area => <button key={area.id} type="button" aria-pressed={activeId === area.id} aria-controls={detailsId}
        onClick={() => chooseArea(area)} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine ${activeId === area.id ? "border-pine bg-pine text-limestone" : "border-line bg-sand text-ink hover:bg-pine/10"}`}>{area.name}</button>)}
    </div>
    <div id={detailsId} className="mt-5 rounded-[20px] bg-sand p-5" aria-live="polite" aria-atomic="true">
      {selectedProject && <article className="mb-4 rounded-2xl border border-line bg-limestone p-4"><h3 className="font-extrabold text-ink">{selectedProject.name}</h3><p className="mt-1 text-sm text-muted">{selectedProject.colorGrade} · {selectedProject.grade} · {selectedProject.owner?.name ?? "Mit projekt"}</p><p className="mt-1 text-xs text-muted">{selectedProject.status} · {selectedProject.attempts} forsøg</p><Link href={`/projekter/${selectedProject.id}`} className="mt-3 inline-block text-sm font-bold text-clay">Åbn projekt</Link></article>}
      {selected ? <>
        <h3 className="text-lg font-extrabold text-ink">{selected.name}</h3>
        {selected.angle && <p className="mt-1 text-sm font-semibold text-muted">Vinkel: {selected.angle}</p>}
        {selected.note && <p className="mt-1 text-sm text-muted">{selected.note}</p>}
        <p className="mt-3 text-sm text-muted">{placement ? "Projektets placering er markeret med en prik." : "Valgt område på kortet."}</p>
        {onPlacementChange && placement && <button type="button" className="mt-3 text-sm font-bold text-clay" onClick={() => { setSelectedId(null); onPlacementChange(undefined); }}>Fjern placering</button>}
      </> : <p className="text-sm font-semibold text-muted">Vælg en væg for at se oplysninger om området.</p>}
    </div>
    {markedProjects.length > 0 && <div className="mt-5"><h3 className="font-extrabold text-ink">{selected ? `Projekter på ${selected.name}` : "Projekter på kortet"}</h3><p className="mt-1 text-xs text-muted">{sectionProjects.length} projekter · tryk på en prik for at se projektet</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{sectionProjects.map(project => <Link key={project.id} href={`/projekter/${project.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-limestone p-3 text-sm"><span className="h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: project.colorGrade ? climbingColorStyles[project.colorGrade] : "#71827b" }} /><span><span className="block font-bold">{project.name}</span><span className="text-xs text-muted">{project.grade} · {project.owner?.name ?? "Mit projekt"}</span></span></Link>)}</div></div>}
  </section>;
}
