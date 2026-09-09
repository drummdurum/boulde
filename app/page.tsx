import { cookies } from "next/headers";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getFollowingProjectFeed, getUserPosts, getUserProjects, getUserSessions } from "@/lib/user-data";
import { toPlainData } from "@/lib/serialization";
import { getIncomingConnectionRequests } from "@/lib/social";

export default async function Home() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return <LandingPage />;
  const [posts, projects, followingProjects, sessions, connectionRequests] = await Promise.all([getUserPosts(user), getUserProjects(user.id), getFollowingProjectFeed(user.id), getUserSessions(user.id), getIncomingConnectionRequests(user.id)]);
  return <Dashboard user={toPlainData(user)} initialPosts={toPlainData(posts)} initialProjects={toPlainData(projects)} followingProjects={toPlainData(followingProjects)} invitations={toPlainData(sessions.filter(session => session.viewerRole === "invitee" && session.invitationStatus === "pending"))} connectionRequests={toPlainData(connectionRequests)} />;
}
