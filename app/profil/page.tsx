import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserProfilePage } from "@/components/UserProfilePage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getUserPosts, getUserProjects } from "@/lib/user-data";
import { getFollowCounts } from "@/lib/social";
export const metadata: Metadata = { title: "Min profil · Boulde" };
export default async function Profile() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  const [posts, projects, followCounts] = await Promise.all([getUserPosts(user), getUserProjects(user.id), getFollowCounts(user.id)]);
  return <UserProfilePage user={user} createdAt={user.createdAt} posts={posts} projects={projects} followCounts={followCounts} />;
}
