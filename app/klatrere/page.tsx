import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { findUsers } from "@/lib/social";
import { ClimbersPage } from "@/components/ClimbersPage";

export const metadata: Metadata = { title: "Find klatrere · Boulde" };
export default async function Climbers() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return <ClimbersPage initialUsers={await findUsers(user.id)} />;
}
