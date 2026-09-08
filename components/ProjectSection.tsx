"use client";
import { useState } from "react";
import { ArrowRight, CircleDot } from "lucide-react";
import Link from "next/link";
import type { ClimbingProject, ProjectStatus } from "@/types";
import { Badge } from "./ui/Badge";

const filters: Array<"Alle" | ProjectStatus> = [
  "Alle",
  "Ny",
  "Arbejder på den",
  "Tæt på",
  "Gennemført",
];
function ProjectCard({ project }: { project: ClimbingProject }) {
  const tone =
    project.status === "Tæt på"
      ? "positive"
      : project.status === "Arbejder på den"
        ? "warm"
        : "neutral";
  return (
    <article className="rounded-[20px] border border-line bg-limestone p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-ink">{project.name}</h3>
          <p className="mt-1 text-xs text-muted">
            {project.location} · {project.grade}
          </p>
        </div>
        <Badge tone={tone}>
          <CircleDot size={11} />
          {project.status}
        </Badge>
      </div>
      <p className="mt-3 text-xs italic leading-5 text-muted">
        “{project.note}”
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-sand"
        aria-label={`${project.progress} procent fremskridt`}
        role="progressbar"
        aria-valuenow={project.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-ochre"
          style={{ width: `${project.progress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted">
        <span>{project.attempts} forsøg</span>
        <span>Sidst: {project.lastAttempt}</span>
      </div>
    </article>
  );
}
export function ProjectSection({ projects }: { projects: ClimbingProject[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Alle");
  const visible =
    filter === "Alle" ? projects : projects.filter((p) => p.status === filter);
  return (
    <section aria-labelledby="projects-title">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">
            Din progression
          </p>
          <h2
            id="projects-title"
            className="mt-1 text-xl font-extrabold text-ink"
          >
            Mine projekter
          </h2>
        </div>
        <Link
          href="/projekter"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-ink transition hover:bg-sand"
        >
          Se alle <ArrowRight size={16} />
        </Link>
      </div>
      <label className="mb-4 block">
        <span className="sr-only">Filtrér projekter efter status</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="h-10 w-full rounded-full border border-line bg-limestone px-4 text-xs font-bold text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
        >
          {filters.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <div className="space-y-3">
        {visible.map((project) => (
          <Link
            href="/projekter"
            key={project.id}
            className="block rounded-[20px] transition hover:ring-2 hover:ring-clay/30"
          >
            <ProjectCard project={project} />
          </Link>
        ))}
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
            Ingen projekter med denne status endnu.
          </p>
        )}
      </div>
    </section>
  );
}
