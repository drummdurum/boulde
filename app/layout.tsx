import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppSidebar, MobileNavigation } from "@/components/navigation";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
export const metadata: Metadata = { title: "Boulde · Dit klatrefællesskab", description: "Følg din klatring, del dine sends og find dit næste projekt." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authenticated = Boolean(await userFromSession(cookies().get(SESSION_COOKIE)?.value));
  return <html lang="da"><body className={manrope.variable}><AppSidebar authenticated={authenticated} />{children}<MobileNavigation authenticated={authenticated} /></body></html>;
}
