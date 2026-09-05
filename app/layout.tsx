import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppSidebar, MobileNavigation } from "@/components/navigation";
import { LanguageProvider, type Language } from "@/components/LanguageProvider";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
export const metadata: Metadata = { title: "Boulde · Dit klatrefællesskab", description: "Følg din klatring, del dine sends og find dit næste projekt." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = cookies();
  const user = await userFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  const language: Language = cookieStore.get("boulde-language")?.value === "en" ? "en" : "da";
  return <html lang={language}><body className={manrope.variable}><LanguageProvider initialLanguage={language}><AppSidebar user={user} />{children}<MobileNavigation authenticated={Boolean(user)} /></LanguageProvider></body></html>;
}
