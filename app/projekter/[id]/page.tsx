import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MapPin, Target, UserRound } from "lucide-react";
import { ProjectMediaPanel } from "@/components/ProjectMedia";
import { CopenhagenSouthMap } from "@/components/gym-map/CopenhagenSouthMap";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getProjectForViewer } from "@/lib/user-data";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value); if (!user) redirect("/login");
  const project = await getProjectForViewer(user.id, params.id); if (!project) notFound();
  return <main className="min-h-screen px-4 pb-28 pt-6 sm:px-6 lg:ml-[238px] lg:px-8"><div className="mx-auto max-w-3xl"><header className="rounded-[28px] bg-pine p-7 text-limestone shadow-soft"><p className="flex items-center gap-2 text-xs font-extrabold text-limestone/60"><UserRound size={15} />{project.owner?.name} · @{project.owner?.username}</p><h1 className="mt-3 text-3xl font-extrabold">{project.name}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-limestone/70"><span className="flex items-center gap-1.5"><MapPin size={16} />{project.location}</span><span className="flex items-center gap-1.5"><Target size={16} />{project.grade}</span></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-limestone/15"><div className="h-full rounded-full bg-ochre" style={{ width: `${project.progress}%` }} /></div><p className="mt-2 text-xs font-bold text-limestone/70">{project.status} · {project.progress}%</p></header>{project.placeSlug === "boulders-kbh-sydhavn" && project.mapPlacement && <CopenhagenSouthMap placement={project.mapPlacement} />}<ProjectMediaPanel projectId={project.id} /></div></main>;
}
