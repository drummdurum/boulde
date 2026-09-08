import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsPage } from "@/components/ProjectsPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getPlaces } from "@/lib/place-data";
import { getUserProjects, getVisibleConnectionProjects } from "@/lib/user-data";
export const metadata: Metadata = { title: "Mine projekter · Boulde" };
export default async function Projects() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const [projects, connectionProjects, places] = await Promise.all([getUserProjects(user.id), getVisibleConnectionProjects(user.id), getPlaces()]);
  return <ProjectsPage initialProjects={projects} connectionProjects={connectionProjects} availablePlaces={places} />;
}
