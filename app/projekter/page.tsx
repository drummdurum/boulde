import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsPage } from "@/components/ProjectsPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getUserProjects } from "@/lib/user-data";
export const metadata: Metadata = { title: "Mine projekter · Boulde" };
export default async function Projects() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return <ProjectsPage initialProjects={await getUserProjects(user.id)} />;
}
