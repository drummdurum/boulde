"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";

export type Language = "da" | "en";
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({ language: "da", setLanguage: () => undefined });

const daToEn: Record<string, string> = {
  "Dashboard": "Dashboard", "Klatrere": "Climbers", "Mine projekter": "My projects", "Sessioner": "Sessions", "Klatresteder": "Climbing locations", "Gemte opslag": "Saved posts", "Profil": "Profile", "Indstillinger": "Settings", "Projekter": "Projects",
  "Log ud": "Log out", "Log ind": "Log in", "Opret profil": "Create profile", "Opret bruger": "Create account",
  "Dit fællesskab": "Your community", "Find klatrere": "Find climbers", "Find andre klatrere og følg deres rejse.": "Find other climbers and follow their journey.", "Søg efter klatrere": "Search for climbers", "Søg på navn eller brugernavn": "Search by name or username", "Følger": "Following", "Følg": "Follow", "Ingen klatrere matcher din søgning.": "No climbers match your search.",
  "Opret forbindelse": "Connect", "Afventer": "Pending", "Forbundet": "Connected", "Acceptér": "Accept", "Afvis": "Decline", "Afslå": "Decline", "Kunne ikke opdatere forbindelsen.": "Could not update the connection.",
  "Seneste på væggen": "Latest on the wall", "Offentlige projekter fra dem, du følger, og dine egne opslag.": "Public projects from people you follow, and your own posts.", "Dit feed er klar": "Your feed is ready", "Du har ingen opslag endnu. Del din første klatring, når du er klar.": "You have no posts yet. Share your first climb when you are ready.", "Følg andre klatrere for at se deres offentlige projekter, billeder og videoer her.": "Follow other climbers to see their public projects, photos, and videos here.", "Opret dit første opslag": "Create your first post", "Næste skridt": "Next step", "Opret dit første projekt": "Create your first project", "Saml beta og forsøg på den linje, du arbejder på.": "Collect beta and attempts for the line you are working on.", "Gå til projekter": "Go to projects", "delte et projekt": "shared a project", "Offentligt": "Public", "Ingen medier tilføjet endnu": "No media added yet", "Se projekt": "View project",
  "Del din klatring": "Share your climbing", "Opret opslag": "Create post", "Hvad skete der?": "What happened?", "Fortæl om ruten, cruxet eller følelsen…": "Tell us about the route, the crux, or how it felt…", "Rute": "Route", "Rutens navn": "Route name", "Sted": "Location", "Klatrested": "Climbing location", "Grade": "Grade", "Type": "Type", "Boulder": "Bouldering", "Sportsklatring": "Sport climbing", "Indendørs": "Indoor", "Billede": "Photo", "Video": "Video", "Opslaget gemmes på din profil. Medie-upload kommer i næste trin.": "The post is saved to your profile. Media upload comes in the next step.", "Udgiv opslag": "Publish post", "Udgiver…": "Publishing…",
  "Din vej mod toppen": "Your path to the top", "Gem beta, billeder og videoer fra hvert forsøg — så du kan se, hvad der virker næste gang.": "Save beta, photos, and videos from every attempt so you can see what works next time.", "Nyt projekt": "New project", "Alle": "All", "Ny": "New", "Arbejder på den": "Working on it", "Tæt på": "Close", "Gennemført": "Completed", "Ingen projekter med denne status.": "No projects with this status.", "Du har ingen projekter endnu": "You have no projects yet", "Når du opretter et projekt, kan du samle dine forsøg, noter og fremskridt her.": "When you create a project, you can collect attempts, notes, and progress here.", "Vælg et projekt": "Choose a project", "Dine aktive linjer": "Your active lines", "Scroll vandret →": "Scroll horizontally →", "Fra dit netværk": "From your network", "Synlige projekter": "Visible projects", "Privat projekt": "Private project", "Synligt for forbindelser": "Visible to connections", "Gør privat": "Make private", "Gør synligt": "Make visible", "Fremskridt": "Progress", "Nyt forsøg": "New attempt", "Visuel arbejdslog": "Visual work log", "Seneste forsøg": "Latest attempts", "Ingen forsøg logget endnu.": "No attempts logged yet.", "Ny linje": "New line", "Opret projekt": "Create project", "Projektnavn": "Project name", "F.eks. Granitdrømmen": "E.g. Granite Dream", "F.eks. Kjugekull": "E.g. Kjugekull", "Første beta": "Initial beta", "(valgfri)": "(optional)", "Hvad vil du huske?": "What do you want to remember?", "Gemmer…": "Saving…",
  "Find din næste væg": "Find your next wall", "Find centre, se praktisk information og opdag offentlige projekter fra klatrere i fællesskabet.": "Find gyms, practical information, and public projects from community climbers.", "Foreslå et sted": "Suggest a location", "Søg efter sted": "Search for a location", "Søg på navn, by eller adresse…": "Search by name, city, or address…", "Filtrér efter region": "Filter by region", "Læs mere": "Read more", "hver dag": "daily", "Ingen steder matcher": "No locations match", "Prøv en anden søgning, eller foreslå stedet til os.": "Try another search, or suggest the location to us.", "Hjælp fællesskabet": "Help the community", "Foreslå et klatrested": "Suggest a climbing location", "Navn på stedet": "Location name", "F.eks. Blocs & Walls": "E.g. Blocs & Walls", "Adresse": "Address", "Gade, postnummer og by": "Street, postal code, and city", "Website": "Website", "Bemærkning": "Note", "Fortæl os gerne lidt om stedet": "Tell us a little about the place", "Send forslag": "Send suggestion", "Sender…": "Sending…", "Tak for dit forslag!": "Thanks for your suggestion!", "Det er sendt til gennemgang og bliver ikke offentliggjort automatisk.": "It has been submitted for review and will not be published automatically.", "Luk": "Close", "Alle klatresteder": "All climbing locations", "Åbn i Maps": "Open in Maps", "Fra fællesskabet": "From the community", "Offentlige projekter her": "Public projects here", "Projekter som andre klatrere har valgt at dele offentligt.": "Projects that other climbers have chosen to share publicly.", "Ingen offentlige projekter endnu": "No public projects yet", "Det første delte projekt på dette sted dukker op her.": "The first shared project at this location will appear here.",
  "Planlæg sammen": "Plan together", "Dine sessioner": "Your sessions", "Opret en klatresession, vælg eventuelt et projekt, og del linket med dem du vil invitere.": "Create a climbing session, optionally choose a project, and share the link with the people you want to invite.", "Ny session": "New session", "Ingen sessioner endnu": "No sessions yet", "Opret en session og send linket til dine klatrevenner.": "Create a session and send the link to your climbing friends.", "Opret din første session": "Create your first session", "Invitér andre": "Invite others", "Titel": "Title", "F.eks. Fredagsbouldering": "E.g. Friday bouldering", "Dato": "Date", "Tid": "Time", "Projekt": "Project", "(valgfrit)": "(optional)", "Ingen – fri klatring": "None – free climbing", "Opretter…": "Creating…", "Opret og få delingslink": "Create and get sharing link", "Du er inviteret": "You are invited", "Arrangeret af": "Hosted by", "Kopieret": "Copied", "Del": "Share", "Opdateres live": "Updates live", "Vært": "Host", "Du er med!": "You’re joining!", "Vil du med?": "Want to join?", "Dit navn": "Your name", "Tilmelder…": "Joining…", "Jeg er med": "I’m joining",
  "Invitér forbindelser": "Invite connections", "Opret session og invitér": "Create session and invite", "Du har afslået invitationen": "You declined the invitation", "Bestem, hvem der må sende dig direkte sessioninvitationer.": "Choose who may send you direct session invitations.", "Privatliv og kontrol": "Privacy and control", "Hvem må invitere dig?": "Who may invite you?", "Kun forbindelser": "Connections only", "Personer jeg følger": "People I follow", "Indstillingen er gemt.": "Setting saved.",
  "Dit næste projekt starter her": "Your next project starts here", "Mere end en logbog. Dit klatrefællesskab.": "More than a logbook. Your climbing community.", "Bliv en del af fællesskabet": "Join the community", "Opret din profil": "Create your profile", "Det tager kun et øjeblik. Så er du klar til at gemme projekter og dele dine sends.": "It only takes a moment. Then you’re ready to save projects and share your sends.", "Navn": "Name", "Dit fulde navn": "Your full name", "Brugernavn": "Username", "f.eks. majaklatrer": "e.g. mayaclimber", "By": "City", "f.eks. København": "e.g. Copenhagen", "E-mail": "Email", "dig@eksempel.dk": "you@example.com", "Adgangskode": "Password", "Mindst 8 tegn": "At least 8 characters", "Din adgangskode": "Your password", "Skjul adgangskode": "Hide password", "Vis adgangskode": "Show password", "Ved at oprette en profil accepterer du Bouldes vilkår og privatlivspolitik.": "By creating a profile, you accept Boulde’s terms and privacy policy.", "Har du allerede en bruger?": "Already have an account?", "Velkommen tilbage": "Welcome back", "Fortsæt din klatrerejse": "Continue your climbing journey", "Har du ikke en bruger?": "Don’t have an account?",
  "Vælg billede": "Choose photo", "Vælg video": "Choose video", "Note": "Note", "Uploader…": "Uploading…", "Gem forsøg": "Save attempt", "Tag et billede": "Take a photo", "Tilføj video": "Add video", "Din note": "Your note", "Billeder og video bliver kun vist lokalt i denne prototype.": "Photos and videos are only shown locally in this prototype.", "Hvad gjorde du?": "What did you do?", "Optag eller vælg medier, og skriv den beta du vil huske til næste session.": "Record or choose media, and write down the beta you want to remember for the next session.", "Skriv en kommentar": "Write a comment", "Skriv en kommentar…": "Write a comment…", "Send kommentar": "Send comment", "Gem opslag": "Save post", "Fjern fra gemte opslag": "Remove from saved posts"
};
const enToDa = Object.fromEntries(Object.entries(daToEn).map(([da, en]) => [en, da]));
const attributes = ["placeholder", "aria-label", "title"] as const;

function translateText(value: string, language: Language) {
  const dictionary = language === "en" ? daToEn : enToDa;
  const leading = value.match(/^\s*/)?.[0] ?? ""; const trailing = value.match(/\s*$/)?.[0] ?? ""; const core = value.trim();
  if (dictionary[core]) return leading + dictionary[core] + trailing;
  if (language === "en") return value.replace(/(\d+) steder\b/g, "$1 locations").replace(/(\d+) sted\b/g, "$1 location").replace(/(\d+) deltagere\b/g, "$1 participants").replace(/(\d+) forsøg\b/g, "$1 attempts").replace(/(\d+) i alt\b/g, "$1 total").replace(/Arrangeret af /g, "Hosted by ");
  return value.replace(/(\d+) locations\b/g, "$1 steder").replace(/(\d+) location\b/g, "$1 sted").replace(/(\d+) participants\b/g, "$1 deltagere").replace(/(\d+) attempts\b/g, "$1 forsøg").replace(/(\d+) total\b/g, "$1 i alt").replace(/Hosted by /g, "Arrangeret af ");
}

function isUserContent(node: Node) {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest("[data-no-translate]"));
}

function translateDom(root: Node, language: Language) {
  if (isUserContent(root)) return;
  if (root.nodeType === Node.TEXT_NODE && root.textContent) root.textContent = translateText(root.textContent, language);
  if (!(root instanceof Element || root instanceof Document)) return;
  if (root instanceof Element) for (const attribute of attributes) { const value = root.getAttribute(attribute); if (value) root.setAttribute(attribute, translateText(value, language)); }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null; while ((node = walker.nextNode())) {
    if (isUserContent(node)) continue;
    if (node instanceof HTMLScriptElement || node instanceof HTMLStyleElement) { walker.currentNode = node; continue; }
    if (node.nodeType === Node.TEXT_NODE && node.textContent) node.textContent = translateText(node.textContent, language);
    else if (node instanceof Element) for (const attribute of attributes) { const value = node.getAttribute(attribute); if (value) node.setAttribute(attribute, translateText(value, language)); }
  }
}

export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Language; children: React.ReactNode }) {
  const [language, updateLanguage] = useState(initialLanguage);
  const previousLanguage = useRef<Language>(initialLanguage);
  const setLanguage = useCallback((next: Language) => { document.cookie = `boulde-language=${next}; path=/; max-age=31536000; samesite=lax`; updateLanguage(next); }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    const mustTranslateExistingDom = language === "en" || previousLanguage.current !== language;
    if (mustTranslateExistingDom) translateDom(document.body, language);
    previousLanguage.current = language;
    if (language === "da") return;

    const pending = new Set<Node>();
    let frame: number | undefined;
    const flush = () => {
      frame = undefined;
      const roots = Array.from(pending).filter(node => !Array.from(pending).some(other => other !== node && other.contains?.(node)));
      pending.clear();
      roots.forEach(node => translateDom(node, language));
    };
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => pending.add(node)));
      if (pending.size && frame === undefined) frame = window.requestAnimationFrame(flush);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); if (frame !== undefined) window.cancelAnimationFrame(frame); pending.clear(); };
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}<LanguageToggle /></LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  return <div className="fixed right-3 top-3 z-[60] flex items-center rounded-full border border-line bg-limestone/95 p-1 shadow-soft backdrop-blur" aria-label={language === "da" ? "Vælg sprog" : "Choose language"}><Languages size={15} className="ml-2 mr-1 text-muted" /><button onClick={() => setLanguage("da")} aria-pressed={language === "da"} className={`rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${language === "da" ? "bg-pine text-limestone" : "text-muted"}`}>DA</button><button onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${language === "en" ? "bg-pine text-limestone" : "text-muted"}`}>EN</button></div>;
}
