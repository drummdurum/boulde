import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsPage } from "@/components/ProjectsPage";
import { ConnectionProjectsPage } from "@/components/ConnectionProjectsPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getUserProjects, getVisibleConnectionProjects } from "@/lib/user-data";
export const metadata: Metadata = { title: "Mine projekter · Boulde" };
export default async function Projects() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const [projects, connectionProjects] = await Promise.all([getUserProjects(user.id), getVisibleConnectionProjects(user.id)]);
  return projects.length ? <ProjectsPage initialProjects={projects} connectionProjects={connectionProjects} /> : connectionProjects.length ? <ConnectionProjectsPage projects={connectionProjects} /> : <ProjectsPage initialProjects={projects} />;
}
