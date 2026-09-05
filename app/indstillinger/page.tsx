import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/SettingsPage";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { getSessionInvitePolicy } from "@/lib/preferences";

export const metadata: Metadata = { title: "Indstillinger · Boulde" };
export default async function Settings() {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return <SettingsPage initialPolicy={await getSessionInvitePolicy(user.id)} />;
}
