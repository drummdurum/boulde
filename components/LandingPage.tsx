import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Mountain, Route, Sparkles, Users } from "lucide-react";

const benefits = [
  {
    icon: Route,
    title: "Saml dine projekter",
    text: "Gem beta, forsøg og fremskridt, så du ved præcis, hvor du skal starte næste gang."
  },
  {
    icon: Users,
    title: "Klatr sammen",
    text: "Følg vennernes sends, del dine egne og planlæg den næste session i fællesskab."
  },
  {
    icon: Sparkles,
    title: "Husk de gode dage",
    text: "Byg din personlige klatrehistorik med steder, grader, billeder og små sejre."
  }
] as const;

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-limestone">
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay">
          <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-pine text-limestone"><Mountain size={23} /></span>
          <span className="text-2xl font-extrabold tracking-[-.04em] text-pine">Boulde</span>
        </Link>
        <nav aria-label="Log ind eller opret bruger" className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-extrabold text-pine transition hover:bg-sand sm:px-4">Log ind</Link>
          <Link href="/opret" className="rounded-xl bg-pine px-4 py-2.5 text-sm font-extrabold text-limestone shadow-soft transition hover:-translate-y-0.5 hover:bg-pine/90 sm:px-5">Opret dig</Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 sm:pt-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e7eadf] px-3.5 py-2 text-xs font-extrabold uppercase tracking-[.13em] text-pine">
            <span className="h-2 w-2 rounded-full bg-clay" /> Dit klatreliv, samlet ét sted
          </p>
          <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[.98] tracking-[-.055em] text-ink sm:text-6xl lg:text-7xl">
            Flere sends.<br /><span className="text-clay">Mere fællesskab.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base font-semibold leading-7 text-muted sm:text-lg sm:leading-8">
            Boulde hjælper dig med at holde styr på projekter, dele dine bedste øjeblikke og finde motivation til næste session.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/opret" className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-pine px-6 py-3.5 text-sm font-extrabold text-limestone shadow-soft transition hover:-translate-y-0.5 hover:bg-pine/90">
              Opret gratis profil <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="inline-flex h-13 items-center justify-center rounded-2xl border border-line bg-white px-6 py-3.5 text-sm font-extrabold text-pine transition hover:border-moss hover:bg-sand">
              Jeg har allerede en profil
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-muted">
            <span className="flex items-center gap-1.5"><Check size={15} className="text-positive" /> Gratis at komme i gang</span>
            <span className="flex items-center gap-1.5"><Check size={15} className="text-positive" /> Bygget til klatrere</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-ochre/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[32px] bg-pine p-2.5 shadow-[0_28px_80px_rgba(38,56,45,.2)] sm:rounded-[42px] sm:p-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] sm:rounded-[32px]">
              <Image src="/images/nordic-boulder.png" alt="Klatrer på en stor granitblok i en nordisk skov" fill priority className="object-cover" sizes="(min-width: 1024px) 52vw, 92vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-pine/65 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-limestone sm:p-7">
                <p className="text-xs font-extrabold uppercase tracking-[.15em] text-limestone/70">Dagens projekt</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div><p className="text-2xl font-extrabold">Granitdrømmen</p><p className="mt-1 text-sm font-semibold text-limestone/75">Kjugekull · 7A</p></div>
                  <span className="rounded-full bg-limestone px-3 py-1.5 text-xs font-extrabold text-pine">Tæt på</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -left-3 top-8 rounded-2xl bg-white p-3.5 shadow-soft sm:-left-7 sm:top-14 sm:p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Denne måned</p>
            <p className="mt-1 text-xl font-extrabold text-ink">12 sends <span className="text-sm text-positive">↑ 3</span></p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-sand/70">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">Fra første forsøg til send</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Alt det, du vil huske fra væggen.</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[26px] border border-line bg-limestone p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pine text-limestone"><Icon size={21} /></span>
                <h3 className="mt-5 text-lg font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
