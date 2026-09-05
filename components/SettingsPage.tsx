"use client";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import type { SessionInvitePolicy } from "@/lib/preferences";

const options: Array<{ value: SessionInvitePolicy; title: string; description: string }> = [
  { value: "connections", title: "Kun forbindelser", description: "Personer, du har accepteret en forbindelse med, kan invitere dig direkte." },
  { value: "following", title: "Personer jeg følger", description: "Alle, du følger, kan invitere dig direkte." },
  { value: "everyone", title: "Alle", description: "Alle Boulde-brugere kan sende dig en direkte invitation." },
  { value: "none", title: "Ingen", description: "Du kan stadig deltage via et invitationslink." },
];

export function SettingsPage({ initialPolicy }: { initialPolicy: SessionInvitePolicy }) {
  const [policy, setPolicy] = useState(initialPolicy);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function update(next: SessionInvitePolicy) {
    const previous = policy; setPolicy(next); setSaving(true); setSaved(false);
    try {
      const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionInvitePolicy: next }) });
      if (!response.ok) throw new Error();
      setSaved(true); window.setTimeout(() => setSaved(false), 1800);
    } catch { setPolicy(previous); }
    finally { setSaving(false); }
  }
  return <main className="min-h-screen px-4 pb-28 pt-6 sm:px-6 lg:ml-[238px] lg:px-8 lg:pb-10 xl:px-10"><div className="mx-auto max-w-3xl">
    <header><p className="text-xs font-extrabold uppercase tracking-[.16em] text-clay">Privatliv og kontrol</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Indstillinger</h1><p className="mt-2 text-sm font-semibold text-muted">Bestem, hvem der må sende dig direkte sessioninvitationer.</p></header>
    <section className="mt-7 rounded-[26px] border border-line bg-limestone p-5 shadow-soft sm:p-7"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand text-moss"><ShieldCheck size={22} /></span><div><h2 className="text-lg font-extrabold text-ink">Hvem må invitere dig?</h2><p className="mt-1 text-sm font-semibold leading-6 text-muted">Indstillingen gælder direkte invitationer. Delte invitationslinks fungerer fortsat.</p></div></div>
      <div className="mt-6 space-y-3">{options.map(option => <label key={option.value} className={`flex cursor-pointer gap-4 rounded-[20px] border p-4 transition ${policy === option.value ? "border-moss bg-[#e4eee5]" : "border-line hover:bg-sand"}`}><input type="radio" name="invitePolicy" value={option.value} checked={policy === option.value} disabled={saving} onChange={() => update(option.value)} className="sr-only" /><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${policy === option.value ? "border-moss bg-moss text-white" : "border-muted"}`}>{policy === option.value && <Check size={13} />}</span><span><strong className="block text-sm text-ink">{option.title}</strong><span className="mt-1 block text-xs font-semibold leading-5 text-muted">{option.description}</span></span></label>)}</div>
      <p aria-live="polite" className="mt-4 h-5 text-sm font-bold text-positive">{saved ? "Indstillingen er gemt." : ""}</p>
    </section>
  </div></main>;
}
