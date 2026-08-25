import { cookies } from "next/headers";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getUserPosts, getUserProjects } from "@/lib/user-data";

export default async function Home() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return <LandingPage />;
  const [posts, projects] = await Promise.all([getUserPosts(user), getUserProjects(user.id)]);
  return <Dashboard user={user} initialPosts={posts} initialProjects={projects} />;
}
