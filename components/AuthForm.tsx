"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Check, Eye, EyeOff, LoaderCircle, Mountain } from "lucide-react";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [showPassword, setShowPassword] = useState(false); const register = mode === "register";
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setLoading(true); const values = Object.fromEntries(new FormData(event.currentTarget)); try { const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Noget gik galt."); router.push("/"); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Noget gik galt."); } finally { setLoading(false); } }
  const inputClass = "mt-2 h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-ink outline-none transition placeholder:text-muted/60 focus:border-clay focus:ring-2 focus:ring-clay/20";
  if (register) return <main className="min-h-screen bg-sand p-3 sm:p-5 lg:grid lg:place-items-center">
    <section className="mx-auto grid min-h-[calc(100vh-24px)] w-full max-w-6xl overflow-hidden rounded-[30px] border border-line bg-limestone shadow-[0_24px_70px_rgba(38,56,45,.12)] sm:min-h-[calc(100vh-40px)] lg:grid-cols-[.92fr_1.08fr]">
      <div className="relative hidden min-h-[760px] overflow-hidden bg-pine lg:block">
        <Image src="/images/nordic-boulder.png" alt="Klatrer på en granitblok i skoven" fill priority className="object-cover" sizes="45vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/30 to-pine/5" />
        <Link href="/" className="absolute left-9 top-9 flex items-center gap-3 rounded-xl text-limestone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limestone">
          <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-limestone text-pine"><Mountain size={23} /></span>
          <span className="text-2xl font-extrabold tracking-[-.04em]">Boulde</span>
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-10 text-limestone">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-limestone/70">Dit næste projekt starter her</p>
          <h2 className="mt-3 max-w-md text-4xl font-extrabold leading-tight tracking-[-.045em]">Mere end en logbog. Dit klatrefællesskab.</h2>
          <div className="mt-7 space-y-3 text-sm font-bold text-limestone/85">
            {["Følg dine projekter og fremskridt", "Gem beta, billeder og gode forsøg", "Del dine sends med andre klatrere"].map(item => <p key={item} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-limestone/15"><Check size={14} /></span>{item}</p>)}
          </div>
        </div>
      </div>
      <div className="flex items-center px-5 py-7 sm:px-10 sm:py-10 lg:px-14">
        <div className="mx-auto w-full max-w-lg">
          <Link href="/" className="mb-9 flex items-center gap-3 lg:hidden"><span className="grid h-11 w-11 place-items-center rounded-[15px] bg-pine text-limestone"><Mountain size={23} /></span><span className="text-2xl font-extrabold tracking-[-.04em] text-pine">Boulde</span></Link>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-clay">Bliv en del af fællesskabet</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Opret din profil</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">Det tager kun et øjeblik. Så er du klar til at gemme projekter og dele dine sends.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-extrabold text-ink">Navn<input className={inputClass} name="name" autoComplete="name" placeholder="Dit fulde navn" required /></label>
              <label className="block text-sm font-extrabold text-ink">Brugernavn<input className={inputClass} name="username" autoComplete="username" placeholder="f.eks. majaklatrer" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required /></label>
            </div>
            <label className="block text-sm font-extrabold text-ink">By <span className="font-semibold text-muted">(valgfri)</span><input className={inputClass} name="location" autoComplete="address-level2" placeholder="f.eks. København" /></label>
            <label className="block text-sm font-extrabold text-ink">E-mail<input className={inputClass} name="email" type="email" autoComplete="email" placeholder="dig@eksempel.dk" required /></label>
            <label className="block text-sm font-extrabold text-ink">Adgangskode<div className="relative"><input className={`${inputClass} pr-12`} name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} placeholder="Mindst 8 tegn" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink" aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pine text-sm font-extrabold text-limestone shadow-soft transition hover:-translate-y-0.5 hover:bg-pine/90 disabled:translate-y-0 disabled:opacity-60">{loading && <LoaderCircle className="animate-spin" size={18} />}Opret bruger</button>
          </form>
          <p className="mt-5 text-center text-xs font-semibold leading-5 text-muted">Ved at oprette en profil accepterer du Bouldes vilkår og privatlivspolitik.</p>
          <p className="mt-5 border-t border-line pt-5 text-center text-sm text-muted">Har du allerede en bruger? <Link className="font-extrabold text-pine underline-offset-4 hover:underline" href="/login">Log ind</Link></p>
        </div>
      </div>
    </section>
  </main>;

  return <main className="min-h-screen bg-limestone px-5 py-10 lg:ml-0 lg:grid lg:place-items-center"><section className="mx-auto w-full max-w-md"><Link href="/" className="mb-9 flex items-center justify-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[15px] bg-pine text-limestone"><Mountain size={23} /></span><span className="text-2xl font-extrabold tracking-[-.04em] text-pine">Boulde</span></Link><div className="rounded-[30px] border border-line bg-white p-6 shadow-soft sm:p-9">
    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-clay">{register ? "Bliv en del af fællesskabet" : "Velkommen tilbage"}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-ink">{register ? "Opret din profil" : "Log ind på Boulde"}</h1><p className="mt-2 text-sm leading-6 text-muted">{register ? "Gem projekter, del dine sends og find din næste linje." : "Fortsæt hvor du slap med dine projekter og dit klatrefællesskab."}</p>
    <form onSubmit={submit} className="mt-7 space-y-4">{register && <><label className="block text-sm font-extrabold text-ink">Navn<input className={inputClass} name="name" autoComplete="name" placeholder="Dit fulde navn" required /></label><label className="block text-sm font-extrabold text-ink">Brugernavn<input className={inputClass} name="username" autoComplete="username" placeholder="f.eks. majaklatrer" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" required /></label><label className="block text-sm font-extrabold text-ink">By <span className="font-semibold text-muted">(valgfri)</span><input className={inputClass} name="location" autoComplete="address-level2" placeholder="f.eks. København" /></label></>}<label className="block text-sm font-extrabold text-ink">E-mail<input className={inputClass} name="email" type="email" autoComplete="email" placeholder="dig@eksempel.dk" required /></label><label className="block text-sm font-extrabold text-ink">Adgangskode<div className="relative"><input className={`${inputClass} pr-12`} name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} minLength={8} placeholder={register ? "Mindst 8 tegn" : "Din adgangskode"} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-2 text-muted hover:text-ink" aria-label={showPassword ? "Skjul adgangskode" : "Vis adgangskode"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}<button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pine text-sm font-extrabold text-limestone shadow-soft transition hover:bg-pine/90 disabled:opacity-60">{loading && <LoaderCircle className="animate-spin" size={18} />}{register ? "Opret bruger" : "Log ind"}</button></form>
    <p className="mt-6 text-center text-sm text-muted">{register ? "Har du allerede en bruger?" : "Ny på Boulde?"} <Link className="font-extrabold text-pine underline-offset-4 hover:underline" href={register ? "/login" : "/opret"}>{register ? "Log ind" : "Opret dig"}</Link></p>
  </div></section></main>;
}
