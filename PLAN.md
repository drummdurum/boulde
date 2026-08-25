# Boulde — arbejdsplan

> **Aktuelt scope:** Kun fase 1 og fase 2 implementeres nu. Fase 3–12 er planlagt, men afventer.

## 1. Projektopsætning og designstruktur — IMPLEMENTERES NU

**Formål:** Et robust, responsivt frontendfundament, som senere kan kobles til API, database, login og filupload.

**Komponenter:** Design-tokens, `Button`, `Badge`, `Avatar`, `AppSidebar`, `MobileNavigation`.  
**Sider:** Root-layout og dashboard på `/`.  
**Datamodeller:** `User`, `Post`, `Comment`, `ClimbingProject`, `ClimbingSpot`, `ClimbingSession`, `ClimbingGrade`.  
**Afhængigheder:** Next.js, React, TypeScript, Tailwind CSS, Lucide React, ESLint.

- [x] Opret App Router-projekt og værktøjskonfiguration
- [x] Definér samlet farve-, typografi- og spacingretning
- [x] Opret genanvendelige UI-primitiver
- [x] Adskil typer og mockdata fra visningskomponenter
- [x] Etablér responsiv app-shell

## 2. Dashboard — IMPLEMENTERES NU

**Formål:** Give klatreren et socialt, personligt overblik med aktivitet, feed, projekter og inspiration.

**Komponenter:** `DashboardHeader`, `StatCard`, `FeedPost`, `ProjectCard`, `ProjectSection`, `UpcomingSessionCard`, `ClimbingSpotCard`, `CreatePostModal`.  
**Sider:** Dashboard `/`.  
**Datamodeller:** Alle fase 1-modeller samt lokale UI-tilstande for like, gem, kommentarvisning, filter og modal.  
**Afhængigheder:** Navigation, designsystem og mockdata fra fase 1.

- [x] Byg header, statistik og primært feed
- [x] Tilføj mindst tre varierede opslag
- [x] Byg aktive projekter med statusfilter og fremskridt
- [x] Tilføj kommende session og populære steder
- [x] Implementér like, gem, kommentarer og opret-opslag-modal
- [x] Tilpas desktop, tablet og mobil
- [x] Gennemgå semantik, fokus, kontrast og touch-flader

## 3. Brugerprofiler — PLANLAGT

**Formål:** Præsentere identitet, klatrehistorik og udvikling.  
**Komponenter:** Profilheader, statistik, historiktidslinje, grade-graf, følgerliste.  
**Sider:** `/profil/[username]`, `/profil/rediger`.  
**Datamodeller:** Udvidet `User`, `ClimbingAscent`, `Follow`.  
**Afhængigheder:** Dashboard, opslag, autentificering.

- [ ] Offentlig profil og egen profil
- [ ] Redigering af bio, avatar og præferencer
- [ ] Historik og udviklingsvisualisering
- [ ] Følg/fjern følg

## 4. Socialt feed — PLANLAGT

**Formål:** Et personaliseret feed med opslag fra fulgte klatrere og relevante steder.  
**Komponenter:** Feedfiltre, infinite list, tom/error/loading states.  
**Sider:** `/udforsk`, `/opslag/[id]`.  
**Datamodeller:** `Post`, `FeedCursor`, `Reaction`.  
**Afhængigheder:** Profiler, opslag, backend.

- [ ] Fuld feed-side og filtrering
- [ ] Paginering/infinite scroll
- [ ] Detaljevisning og deling
- [ ] Loading-, tom- og fejltilstande

## 5. Oprettelse af opslag — PLANLAGT

**Formål:** Dele gennemførte klatringer med medier og strukturerede metadata.  
**Komponenter:** Trinvis formular, mediepreview, lokations- og gradevælger.  
**Sider:** `/opslag/nyt`, `/opslag/[id]/rediger`.  
**Datamodeller:** `PostDraft`, `MediaAsset`, `ClimbingGrade`, `Location`.  
**Afhængigheder:** Profiler, lokationer, upload, backend.

- [ ] Valideret formular
- [ ] Mediepreview og rækkefølge
- [ ] Lokation, rute, type, grade og dato
- [ ] Kladde, publicering og redigering

## 6. Projekter — PLANLAGT

**Formål:** Følge forsøg, noter og progression på ugennemførte ruter.  
**Komponenter:** Projektliste, statusfilter, forsøgslog, progressionshistorik.  
**Sider:** `/projekter`, `/projekter/[id]`, `/projekter/nyt`.  
**Datamodeller:** `ClimbingProject`, `ProjectAttempt`, `ProjectStatus`.  
**Afhængigheder:** Lokationer, profiler, backend.

- [ ] Opret og redigér projekt
- [ ] Log forsøg og noter
- [ ] Opdatér status
- [ ] Konvertér gennemført projekt til ascent/opslag

## 7. Lokationer og klatresteder — PLANLAGT

**Formål:** Gøre steder og deres ruter søgbare og inspirerende.  
**Komponenter:** Kort, stedkort, faciliteter, ruteliste, vejledningsinfo.  
**Sider:** `/steder`, `/steder/[slug]`.  
**Datamodeller:** `ClimbingSpot`, `Route`, `GeoPoint`, `AccessInfo`.  
**Afhængigheder:** Kortudbyder, opslag, projekter.

- [ ] Søgning og område/typefiltre
- [ ] Steddetaljer og kort
- [ ] Ruter/problemer og grades
- [ ] Adgangs- og sikkerhedsinfo

## 8. Kommentarer, likes og følgere — PLANLAGT

**Formål:** Understøtte meningsfuld social interaktion.  
**Komponenter:** Kommentartåde, reaktionsknap, følgerdialog, notifikationer.  
**Sider:** Indlejret i opslag/profiler samt `/notifikationer`.  
**Datamodeller:** `Comment`, `Like`, `Follow`, `Notification`.  
**Afhængigheder:** Autentificering, profiler, backend.

- [ ] CRUD for kommentarer
- [ ] Like og gem med optimistisk UI
- [ ] Følgerrelationer
- [ ] Notifikationer og moderation

## 9. Autentificering — PLANLAGT

**Formål:** Sikker adgang og ejerskab af brugerdata.  
**Komponenter:** Login, registrering, glemt kodeord, session-guard.  
**Sider:** `/login`, `/opret-konto`, `/glemt-kodeord`.  
**Datamodeller:** `Account`, `Session`, `AuthProvider`.  
**Afhængigheder:** Backend, database, mailudbyder.

- [ ] Vælg auth-løsning
- [ ] Registrering og login
- [ ] Beskyttede routes og sessions
- [ ] Kontogendannelse og log ud

## 10. Backend og database — PLANLAGT

**Formål:** Persistens, relationer, validering og API til alle kerneflows.  
**Komponenter:** Route handlers/service-lag, repository-lag, schemas.  
**Sider:** Ingen selvstændige; driver alle dataflader.  
**Datamodeller:** Relationelle modeller for brugere, opslag, steder, projekter og sociale relationer.  
**Afhængigheder:** Hosting, databasevalg, autentificering.

- [ ] Databaseskema og migrationer
- [ ] Type-sikre API-kontrakter
- [ ] Autorisation og servervalidering
- [ ] Seeddata, pagination og rate limits

## 11. Upload af billeder og video — PLANLAGT

**Formål:** Sikker, hurtig mediehåndtering til opslag og profiler.  
**Komponenter:** Dropzone, uploadstatus, beskæring, video-thumbnail.  
**Sider:** Integreret i opslag og profilredigering.  
**Datamodeller:** `MediaAsset`, `UploadJob`, `MediaVariant`.  
**Afhængigheder:** Objektlager/CDN, backend, autentificering.

- [ ] Vælg storage og CDN
- [ ] Signerede uploads og validering
- [ ] Billedvarianter og video-processing
- [ ] Sletning, alt-tekst og kvoter

## 12. Test, responsivt design og tilgængelighed — PLANLAGT

**Formål:** Sikre stabilitet og god brug på tværs af enheder og hjælpemidler.  
**Komponenter:** Test helpers, Storybook-valgfrit, audit-scripts.  
**Sider:** Alle sider og kritiske flows.  
**Datamodeller:** Test fixtures og accessibility states.  
**Afhængigheder:** Alle foregående faser.

- [ ] Unit- og komponenttests
- [ ] End-to-end tests af kerneflows
- [ ] WCAG-audit og tastaturtest
- [ ] Browser-/device-test og performancebudget
