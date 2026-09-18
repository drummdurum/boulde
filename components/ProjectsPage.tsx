"use client";
/* eslint-disable @next/next/no-img-element -- Object URL previews from local file input cannot use next/image. */
import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Check,
  ChevronRight,
  CircleDot,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  Play,
  Plus,
  Target,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import type { ClimbingColor, ClimbingProject, ProjectStatus } from "@/types";
import { places as defaultPlaces, type Place } from "@/lib/places";
import { climbingColors, climbingColorStyles, climbingGrades } from "@/lib/grading";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { MediaUploadModal, ProjectMediaPanel } from "./ProjectMedia";
import { GymMap } from "./gym-map/GymMap";
import { gymMapForPlace, type MapPlacement, type MapProblemSummary } from "@/lib/gym-maps";

const filters: Array<"Alle" | ProjectStatus> = [
  "Alle",
  "Ny",
  "Arbejder på den",
  "Tæt på",
  "Gennemført",
];
function useModalBehavior(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
    };
  }, [open, onClose]);
}

export function ProjectsPage({
  initialProjects = [],
  connectionProjects = [],
  availablePlaces = defaultPlaces,
}: {
  initialProjects?: ClimbingProject[];
  connectionProjects?: ClimbingProject[];
  availablePlaces?: Place[];
}) {
  const [userProjects, setUserProjects] = useState(initialProjects);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Alle");
  const [selected, setSelected] = useState(initialProjects[0]);
  const [logOpen, setLogOpen] = useState(false);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const selectProject = (project: ClimbingProject) => {
    setSelected(project);
    window.setTimeout(
      () =>
        detailRef.current?.scrollIntoView?.({
          behavior: "smooth",
          block: "start",
        }),
      80,
    );
  };
  const visible =
    filter === "Alle"
      ? userProjects
      : userProjects.filter((project) => project.status === filter);
  const addProject = (project: ClimbingProject) => {
    setUserProjects((current) => [project, ...current]);
    setSelected(project);
    setCreateOpen(false);
  };
  const updateProject = (project: ClimbingProject) => {
    setUserProjects((current) =>
      current.map((item) => (item.id === project.id ? project : item)),
    );
    setSelected(project);
    setEditOpen(false);
  };
  const changeVisibility = async (project: ClimbingProject) => {
    const response = await fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project.id, visible: !project.visible }),
    });
    if (!response.ok) return;
    const updated = (await response.json()).project as ClimbingProject;
    setUserProjects((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelected(updated);
  };
  if (!selected)
    return (
      <>
        <main className="min-h-screen px-4 pb-28 pt-5 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10">
          <div className="mx-auto max-w-[1100px]">
            <header>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">
                Din vej mod toppen
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">
                Mine projekter
              </h1>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-muted">
                Gem beta, billeder og videoer fra hvert forsøg — så du kan se,
                hvad der virker næste gang.
              </p>
            </header>
            <section className="mt-8 grid min-h-[420px] place-items-center rounded-[28px] border border-dashed border-line bg-limestone p-8 text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-sand text-clay">
                  <Target size={29} />
                </span>
                <h2 className="mt-5 text-2xl font-extrabold text-ink">
                  Du har ingen projekter endnu
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted">
                  Når du opretter et projekt, kan du samle dine forsøg, noter og
                  fremskridt her.
                </p>
                <Button onClick={() => setCreateOpen(true)} className="mt-6">
                  <Plus size={18} />
                  Opret dit første projekt
                </Button>
              </div>
            </section>
            {connectionProjects.length > 0 && (
              <ConnectionProjects projects={connectionProjects} />
            )}
          </div>
        </main>
        <CreateProjectModal
          places={availablePlaces}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={addProject}
        />
      </>
    );
  return (
    <main className="min-h-screen px-4 pb-28 pt-5 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10">
      <div className="mx-auto max-w-[1320px]">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">
              Din vej mod toppen
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">
              Mine projekter
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Gem beta, billeder og videoer fra hvert forsøg — så du kan se,
              hvad der virker næste gang.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} />
            Nyt projekt
          </Button>
        </header>
        <div
          className="mb-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="Filtrér projekter"
        >
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay ${filter === item ? "bg-pine text-limestone" : "border border-line bg-limestone text-muted hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
        {connectionProjects.length > 0 && (
          <ConnectionProjects projects={connectionProjects} />
        )}
        <section
          aria-labelledby="project-picker-title"
          className="mb-7"
          data-projects-section="active-lines"
        >
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
                Vælg et projekt
              </p>
              <h2
                id="project-picker-title"
                className="mt-1 text-xl font-extrabold text-ink"
              >
                Dine aktive linjer
              </h2>
            </div>
            <span className="hidden text-xs font-bold text-muted sm:block">
              Scroll vandret →
            </span>
          </div>
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
            aria-label="Vælg projekt"
          >
            {visible.map((project) => (
              <ProjectListCard
                key={project.id}
                project={project}
                active={selected.id === project.id}
                onClick={() => selectProject(project)}
              />
            ))}
            {visible.length === 0 && (
              <p className="w-full rounded-[22px] border border-dashed border-line p-8 text-center text-sm text-muted">
                Ingen projekter med denne status.
              </p>
            )}
          </div>
        </section>
        <div
          ref={detailRef}
          className="scroll-mt-5"
          data-projects-section="selected-project"
        >
          <VisibilityControl project={selected} onChange={() => changeVisibility(selected)} />
          <ProjectDetail project={selected} onLog={() => setLogOpen(true)} onEdit={() => setEditOpen(true)} mediaVersion={mediaVersion} />
        </div>
      </div>
      <CreateProjectModal
        places={availablePlaces}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={addProject}
      />
      {editOpen && (
        <EditProjectModal
          project={selected}
          onClose={() => setEditOpen(false)}
          onUpdated={updateProject}
        />
      )}
      {logOpen && (
        <MediaUploadModal
          project={selected}
          onClose={() => setLogOpen(false)}
          onSaved={(project) => {
            updateProject(project);
            setLogOpen(false);
            setMediaVersion((value) => value + 1);
          }}
        />
      )}
    </main>
  );
}
function ConnectionProjects({ projects }: { projects: ClimbingProject[] }) {
  return (
    <section
      className="mb-7"
      aria-labelledby="connection-projects-title"
      data-projects-section="connections"
    >
      <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
        Fra dit netværk
      </p>
      <h2
        id="connection-projects-title"
        className="mt-1 text-2xl font-extrabold"
      >
        Mine forbindelser
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-[22px] border border-line bg-limestone p-5 shadow-soft"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
              <Users size={15} />
              {project.owner?.name} · @{project.owner?.username}
            </div>
            <h3 className="mt-3 text-lg font-extrabold">{project.name}</h3>
            <p className="mt-1 text-sm font-semibold text-muted">
              {project.location} · {project.grade}{project.colorGrade ? ` · ${project.colorGrade}` : ""}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-ochre"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-muted">
              {project.status} · {project.progress}%
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
function CreateProjectModal({
  places,
  open,
  onClose,
  onCreated,
}: {
  places: Place[];
  open: boolean;
  onClose: () => void;
  onCreated: (project: ClimbingProject) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ProjectStatus>("Ny");
  const [placeId, setPlaceId] = useState("");
  const [mapPlacement, setMapPlacement] = useState<MapPlacement>();
  const [mapSlot, setMapSlot] = useState("");
  const [colorGrade, setColorGrade] = useState<ClimbingColor>("Grøn");
  const [knownProblems, setKnownProblems] = useState<MapProblemSummary[]>([]);
  const map = gymMapForPlace(places.find(place => place.id === placeId)?.slug);
  const hasMap = Boolean(map);
  useEffect(() => {
    setKnownProblems([]);
    if (!hasMap || !open) return;
    const controller = new AbortController();
    fetch(`/api/map-problems?placeId=${encodeURIComponent(placeId)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Kortets problemer kunne ikke hentes."); return response.json(); })
      .then(result => { if (!controller.signal.aborted) setKnownProblems(result.problems ?? []); })
      .catch(() => { if (!controller.signal.aborted) setError("Eksisterende placeringer kunne ikke hentes. Prøv at vælge hallen igen."); });
    return () => controller.abort();
  }, [placeId, open, hasMap]);
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );
  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );
  useEffect(() => {
    if (!open) {
      setImageFile(undefined);
      setProgress(0);
      setStatus("Ny");
      setPlaceId("");
      setMapPlacement(undefined);
      setMapSlot("");
      setColorGrade("Grøn");
      setError("");
    }
  }, [open]);
  useModalBehavior(open, onClose);
  if (!open) return null;
  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0]);
    event.target.value = "";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const values = new FormData(event.currentTarget);
      if (mapPlacement) {
        values.set("mapArea", mapPlacement.areaId);
        values.set("mapX", String(mapPlacement.x));
        values.set("mapY", String(mapPlacement.y));
        values.set("mapSlot", mapSlot);
      }
      if (imageFile) values.set("image", imageFile);
      const response = await fetch("/api/projects", {
        method: "POST",
        body: values,
      });
      const text = await response.text();
      let result: { error?: string; project?: ClimbingProject } = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        /* A non-JSON server error is handled below. */
      }
      if (!response.ok || !result.project)
        throw new Error(
          result.error || "Projektet kunne ikke gemmes. Prøv igen.",
        );
      onCreated(result.project);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Projektet kunne ikke gemmes.",
      );
    } finally {
      setLoading(false);
    }
  }
  const inputClass =
    "mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal outline-none focus:border-moss focus:ring-2 focus:ring-moss/20";
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end overflow-hidden bg-pine/60 backdrop-blur-sm sm:place-items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-create-title"
        className="max-h-[100dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[28px] bg-limestone p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:p-7"
      >
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 flex items-start justify-between border-b border-line/70 bg-limestone/95 px-5 pb-3 pt-5 backdrop-blur sm:-top-7 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
              Ny linje
            </p>
            <h2
              id="project-create-title"
              className="mt-1 text-2xl font-extrabold text-ink"
            >
              Opret projekt
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
        <form onSubmit={submit} className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-sm font-extrabold">
              Start med et billede{" "}
              <span className="font-semibold text-muted">(valgfrit)</span>
            </legend>
            {imagePreview ? (
              <div className="relative mt-2 aspect-[16/9] overflow-hidden rounded-[20px] bg-pine">
                <img
                  src={imagePreview}
                  alt="Forhåndsvisning af projektbillede"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(undefined)}
                  className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-pine/80 text-limestone"
                  aria-label="Fjern projektbillede"
                >
                  <X size={17} />
                </button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] border border-dashed border-moss bg-sand text-sm font-extrabold focus-within:ring-2 focus-within:ring-clay">
                  <Camera size={22} className="text-clay" />
                  Tag billede
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={selectImage}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Tag projektbillede"
                  />
                </label>
                <label className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] border border-dashed border-moss bg-sand text-sm font-extrabold focus-within:ring-2 focus-within:ring-clay">
                  <Upload size={22} className="text-clay" />
                  Vælg billede
                  <input
                    type="file"
                    accept="image/*"
                    onChange={selectImage}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label="Vælg projektbillede"
                  />
                </label>
              </div>
            )}
          </fieldset>
          <label className="block text-sm font-extrabold">
            Projektnavn
            <input
              name="name"
              required
              className={inputClass}
              placeholder="F.eks. Granitdrømmen"
            />
          </label>
          <label className="block text-sm font-extrabold">
            Sted
            <select
              name="placeId"
              required
              className={inputClass}
              value={placeId}
              onChange={event => { setPlaceId(event.target.value); setMapPlacement(undefined); setMapSlot(""); }}
            >
              <option value="" disabled>
                Vælg et klatrested…
              </option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name} · {place.city}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs font-semibold text-muted">
              Mangler stedet?{" "}
              <Link
                href="/steder/foreslaa"
                className="text-clay hover:text-ink"
              >
                Foreslå et nyt sted
              </Link>
            </span>
          </label>
          {map ? <GymMap key={placeId} name={map.name} areas={map.areas} context={map.context} resolveSection={map.resolveSection} placement={mapPlacement} onPlacementChange={next => { setMapPlacement(next); setMapSlot(""); }} />
            : placeId && <p className="rounded-2xl bg-sand p-4 text-sm text-muted">Der er endnu ikke et vægkort til denne hal. Du kan stadig oprette projektet.</p>}
          <label className="block text-sm font-extrabold">
            Grade
            <select name="grade" className={inputClass}>
              {climbingGrades.map(
                (grade) => (
                  <option key={grade}>{grade}</option>
                ),
              )}
            </select>
          </label>
          <label className="block text-sm font-extrabold">
            Boulders-farve
            <select name="colorGrade" value={colorGrade} onChange={event => { setColorGrade(event.target.value as ClimbingColor); setMapSlot(""); }} className={inputClass}>
              {climbingColors.map(color => <option key={color}>{color}</option>)}
            </select>

          </label>
          {mapPlacement && <label className="block text-sm font-extrabold">
            Problem på væggen
            <select required name="mapSlot" value={mapSlot} className={inputClass} onChange={event => {
              setMapSlot(event.target.value);
              const existing = knownProblems.find(problem => problem.areaId === mapPlacement.areaId && problem.colorGrade === colorGrade && String(problem.slot) === event.target.value);
              if (existing) setMapPlacement({ areaId: existing.areaId, x: existing.x, y: existing.y });
            }}>
              <option value="" disabled>Vælg problem 1 eller 2…</option>
              {[1, 2].map(slot => <option key={slot} value={slot}>{colorGrade} {slot}{knownProblems.some(problem => problem.areaId === mapPlacement.areaId && problem.colorGrade === colorGrade && problem.slot === slot) ? " · eksisterende problem" : " · ny placering"}</option>)}
            </select>
            <span className="mt-2 block text-xs font-semibold text-muted">Højst to problemer af hver farve pr. sektion. Flere brugere kan arbejde på samme problem; dets placering bevares.</span>
          </label>}
          <label className="block text-sm font-extrabold">
            Fremskridt: <output>{progress}%</output>
            <input
              name="progress"
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(event) => {
                const nextProgress = Number(event.target.value);
                setProgress(nextProgress);
                if (nextProgress === 100) setStatus("Gennemført");
                else if (status === "Gennemført") setStatus("Tæt på");
              }}
              className="mt-3 w-full accent-clay"
              aria-label="Fremskridt i procent"
            />
          </label>
          <label className="block text-sm font-extrabold">
            Status
            <select
              name="status"
              value={status}
              onChange={(event) => {
                const nextStatus = event.target.value as ProjectStatus;
                setStatus(nextStatus);
                if (nextStatus === "Gennemført") setProgress(100);
              }}
              className={inputClass}
            >
              {filters.slice(1).map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-extrabold">
            Første beta{" "}
            <span className="font-semibold text-muted">(valgfri)</span>
            <textarea
              name="note"
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-line bg-sand p-4 font-normal outline-none focus:border-moss"
              placeholder="Hvad vil du huske?"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Gemmer…" : "Opret projekt"}
          </Button>
        </form>
      </section>
    </div>
  );
}
function EditProjectModal({
  project,
  onClose,
  onUpdated,
}: {
  project: ClimbingProject;
  onClose: () => void;
  onUpdated: (project: ClimbingProject) => void;
}) {
  const [imageFile, setImageFile] = useState<File>();
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(
    () =>
      imageFile
        ? URL.createObjectURL(imageFile)
        : project.image || "/images/nordic-boulder.png",
    [imageFile, project.image],
  );
  useEffect(
    () => () => {
      if (imageFile) URL.revokeObjectURL(preview);
    },
    [imageFile, preview],
  );
  useModalBehavior(true, onClose);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const values = new FormData(event.currentTarget);
      values.set("id", project.id);
      values.set("progress", String(progress));
      if (imageFile) values.set("image", imageFile);
      const response = await fetch("/api/projects", {
        method: "PATCH",
        body: values,
      });
      const text = await response.text();
      let result: { error?: string; project?: ClimbingProject } = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        /* handled below */
      }
      if (!response.ok || !result.project)
        throw new Error(
          result.error || "Projektet kunne ikke opdateres. Prøv igen.",
        );
      onUpdated(result.project);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Projektet kunne ikke opdateres.",
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
        aria-labelledby="edit-project-title"
        className="max-h-[100dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-limestone p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-clay">
              {project.name}
            </p>
            <h2
              id="edit-project-title"
              className="mt-1 text-2xl font-extrabold"
            >
              Rediger projekt
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
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div>
            <p className="text-sm font-extrabold">Projektbillede</p>
            <img
              src={preview}
              alt="Forhåndsvisning af projektbillede"
              className="mt-2 aspect-video w-full rounded-[20px] object-cover"
            />
            <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-line text-sm font-extrabold text-pine">
              <Camera size={18} />
              Vælg nyt billede
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0])}
                className="sr-only"
                aria-label="Vælg nyt projektbillede"
              />
            </label>
          </div>
          <label className="block text-sm font-extrabold">
            Grade
            <select name="grade" defaultValue={project.grade} className="mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal">
              {climbingGrades.map(grade => <option key={grade}>{grade}</option>)}
            </select>
          </label>
          <label className="block text-sm font-extrabold">
            Boulders-farve
            <select disabled={Boolean(project.mapProblemId)} name="colorGrade" defaultValue={project.colorGrade || "Grøn"} className="mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal">
              {climbingColors.map(color => <option key={color}>{color}</option>)}
            </select>
            {project.mapProblemId && <span className="mt-2 block text-xs text-muted">Farven følger det fælles problem på kortet.</span>}
          </label>
          <label className="block text-sm font-extrabold">
            Fremskridt: <output>{progress}%</output>
            <input
              name="progress"
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(event) => {
                const nextProgress = Number(event.target.value);
                setProgress(nextProgress);
                if (nextProgress === 100) setStatus("Gennemført");
                else if (status === "Gennemført") setStatus("Tæt på");
              }}
              className="mt-3 w-full accent-clay"
              aria-label="Fremskridt i procent"
            />
          </label>
          <label className="block text-sm font-extrabold">
            Status
            <select
              name="status"
              value={status}
              onChange={(event) => {
                const nextStatus = event.target.value as ProjectStatus;
                setStatus(nextStatus);
                if (nextStatus === "Gennemført") setProgress(100);
              }}
              className="mt-2 h-11 w-full rounded-2xl border border-line bg-sand px-4 font-normal"
            >
              {filters.slice(1).map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-extrabold">
            Note
            <textarea
              name="note"
              defaultValue={project.note}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-line bg-sand p-4 font-normal"
              placeholder="Hvad har du fundet ud af, og hvad er næste skridt?"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
            >
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Gemmer…" : "Gem ændringer"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function ProjectListCard({
  project,
  active,
  onClick,
}: {
  project: ClimbingProject;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`w-[280px] shrink-0 snap-start rounded-[22px] border p-4 text-left shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay ${active ? "border-pine bg-pine text-limestone" : "border-line bg-limestone text-ink hover:border-moss"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-[.14em] ${active ? "text-[#bdcaba]" : "text-clay"}`}
          >
            {project.location}
          </span>
          <h2 className="mt-1 text-lg font-extrabold">{project.name}</h2>
        </div>
        <ChevronRight
          size={19}
          className={active ? "text-limestone" : "text-muted"}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge tone={project.status === "Tæt på" ? "positive" : "warm"}>
          <CircleDot size={11} />
          {project.status}
        </Badge>
        <span
          className={`text-xs font-extrabold ${active ? "text-limestone" : "text-muted"}`}
        >
          {project.grade}
        </span>
        {project.colorGrade && <span className={`flex items-center gap-1.5 text-xs font-extrabold ${active ? "text-limestone" : "text-muted"}`}><span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: climbingColorStyles[project.colorGrade] }} />{project.colorGrade}</span>}
      </div>
      <div
        className={`mt-4 h-1.5 overflow-hidden rounded-full ${active ? "bg-limestone/15" : "bg-sand"}`}
      >
        <div
          className="h-full rounded-full bg-ochre"
          style={{ width: `${project.progress}%` }}
        />
      </div>
      <p
        className={`mt-2 text-[11px] font-semibold ${active ? "text-[#cbd5c9]" : "text-muted"}`}
      >
        {project.attempts} forsøg · {project.progress}%
      </p>
    </button>
  );
}
function VisibilityControl({
  project,
  onChange,
}: {
  project: ClimbingProject;
  onChange: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-[20px] border border-line bg-limestone p-3 shadow-soft">
      <span className="flex items-center gap-2 text-xs font-extrabold text-muted">
        {project.visible ? (
          <Eye size={17} className="text-positive" />
        ) : (
          <EyeOff size={17} />
        )}
        {project.visible ? "Synligt for forbindelser" : "Privat projekt"}
      </span>
      <Button variant="outline" size="sm" onClick={onChange}>
        {project.visible ? "Gør privat" : "Gør synligt"}
      </Button>
    </div>
  );
}
function ProjectDetail({
  project,
  onLog,
  onEdit,
  mediaVersion = 0,
}: {
  project: ClimbingProject;
  onLog: () => void;
  onEdit: () => void;
  mediaVersion?: number;
}) {
  return (
    <section
      aria-labelledby="detail-title"
      className="overflow-hidden rounded-[28px] border border-line bg-limestone shadow-soft"
    >
      <div className="relative h-52 overflow-hidden bg-pine sm:h-72">
        <img
          src={project.image || "/images/nordic-boulder.png"}
          alt={`Projektet ${project.name} ved ${project.location}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine/80 via-transparent to-transparent" />
        <Badge tone="warm">
          <span className="absolute left-5 top-5 rounded-full bg-limestone px-3 py-2 text-xs font-extrabold text-ink">
            {project.grade}
          </span>
        </Badge>
        {project.colorGrade && <span className="absolute left-5 top-16 flex items-center gap-1.5 rounded-full bg-limestone px-3 py-2 text-xs font-extrabold text-ink"><span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: climbingColorStyles[project.colorGrade] }} />{project.colorGrade}</span>}
        <Button
          onClick={onEdit}
          variant="outline"
          size="icon"
          className="absolute right-4 top-4 border-limestone/30 bg-pine/35 text-limestone backdrop-blur"
          aria-label="Rediger projekt"
        >
          <Pencil size={19} />
        </Button>
        <div className="absolute inset-x-5 bottom-5 text-limestone">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#d9dfd7]">
            <MapPin size={14} />
            {project.location}
          </p>
          <h2
            id="detail-title"
            className="mt-1 text-3xl font-extrabold tracking-tight"
          >
            {project.name}
          </h2>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        {project.mapPlacement && gymMapForPlace(project.placeSlug) && <GymMap key={project.id} name={project.location} areas={gymMapForPlace(project.placeSlug)!.areas} context={gymMapForPlace(project.placeSlug)!.context} resolveSection={gymMapForPlace(project.placeSlug)!.resolveSection} placement={project.mapPlacement} />}
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted">Fremskridt</span>
              <span className="text-ink">{project.progress}%</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-sand"
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
            {project.note && (
              <p className="mt-3 text-sm italic leading-6 text-muted">
                “{project.note}”
              </p>
            )}
          </div>
          <Button onClick={onLog}>
            <Camera size={18} />
            Nyt forsøg
          </Button>
        </div>
        <ProjectMediaPanel
          projectId={project.id}
          version={mediaVersion}
          onNewAttempt={onLog}
          attempts={project.attempts}
          note={project.note}
          progress={project.progress}
          status={project.status}
        />
      </div>
    </section>
  );
}
function AttemptModal({
  open,
  project,
  onClose,
}: {
  open: boolean;
  project: ClimbingProject;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  useModalBehavior(open, onClose);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((item) => URL.revokeObjectURL(item.url)),
    [previews],
  );
  useEffect(() => {
    if (!open) {
      setFiles([]);
      setNote("");
    }
  }, [open]);
  if (!open) return null;
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files)
      setFiles((current) => [...current, ...Array.from(event.target.files!)]);
  };
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end overflow-hidden bg-pine/60 backdrop-blur-sm sm:place-items-center sm:p-5"
      onMouseDown={(event) => event.currentTarget === event.target && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="attempt-title"
        className="max-h-[100dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[28px] bg-limestone p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] sm:p-7"
      >
        <div className="sticky -top-5 z-10 -mx-5 -mt-5 flex items-start justify-between border-b border-line/70 bg-limestone/95 px-5 pb-3 pt-5 backdrop-blur sm:-top-7 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold uppercase tracking-[.15em] text-clay">
              {project.name} · Forsøg #{project.attempts + 1}
            </p>
            <h2
              id="attempt-title"
              className="mt-1 text-2xl font-extrabold text-ink"
            >
              Hvad gjorde du?
            </h2>
          </div>
          <Button
            className="shrink-0"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Luk"
          >
            <X size={20} />
          </Button>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          Optag eller vælg medier, og skriv den beta du vil huske til næste
          session.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-moss bg-sand text-center text-sm font-extrabold text-ink transition hover:bg-[#eee8dc] focus-within:ring-2 focus-within:ring-clay">
            <Camera size={22} className="text-clay" />
            Tag et billede
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={addFiles}
              className="sr-only"
              aria-label="Tag eller vælg et billede"
            />
          </label>
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-moss bg-sand text-center text-sm font-extrabold text-ink transition hover:bg-[#eee8dc] focus-within:ring-2 focus-within:ring-clay">
            <Video size={22} className="text-clay" />
            Tilføj video
            <input
              type="file"
              accept="video/*"
              onChange={addFiles}
              className="sr-only"
              aria-label="Vælg en video"
            />
          </label>
        </div>
        {previews.length > 0 && (
          <div
            className="mt-4 grid grid-cols-3 gap-2"
            aria-label="Valgte medier"
          >
            {previews.map(({ file, url }, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative aspect-square overflow-hidden rounded-2xl bg-pine"
              >
                {file.type.startsWith("video") ? (
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Preview af ${file.name}`}
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  onClick={() =>
                    setFiles((current) => current.filter((_, i) => i !== index))
                  }
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-pine/80 text-limestone"
                  aria-label={`Fjern ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="mt-5 block text-sm font-extrabold text-ink">
          Din note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-[18px] border border-line bg-sand p-4 font-normal leading-6 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
            placeholder="Fx: Højre hæl først, hold hoften tæt og kig mod slutgrebet…"
          />
        </label>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#e4eee5] p-3 text-xs font-semibold leading-5 text-positive">
          <Check size={17} className="shrink-0" />
          Billeder og video bliver kun vist lokalt i denne prototype.
        </div>
        <Button
          className="mt-5 w-full"
          onClick={onClose}
          disabled={!note.trim() && files.length === 0}
        >
          <Upload size={17} />
          Gem forsøg
        </Button>
      </section>
    </div>
  );
}
