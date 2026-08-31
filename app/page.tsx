import { cookies } from "next/headers";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getFollowingProjectFeed, getUserPosts, getUserProjects } from "@/lib/user-data";
import { toPlainData } from "@/lib/serialization";

export default async function Home() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return <LandingPage />;
  const [posts, projects, followingProjects] = await Promise.all([getUserPosts(user), getUserProjects(user.id), getFollowingProjectFeed(user.id)]);
  return <Dashboard user={toPlainData(user)} initialPosts={toPlainData(posts)} initialProjects={toPlainData(projects)} followingProjects={toPlainData(followingProjects)} />;
}
