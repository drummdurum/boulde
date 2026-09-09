# Boulde – systemflows

## Projekt → gennemført → profil

1. Brugeren vælger statusen `Gennemført` i projektets redigering eller ved et nyt forsøg.
2. Klienten sætter fremdrift til `100`.
3. `PATCH /api/projects` gemmer status og fremdrift på Neo4j-projektet.
4. Profilen henter brugerens projekter via `getUserProjects`.
5. Projekter med status `Gennemført` tælles i profilstats og vises under **Klatrehistorik**.

Dashboardet bruger de samme projektdata: **Gennemførte klatringer** tæller alle projekter med status `Gennemført`, mens **Klatresteder besøgt** tæller unikke projektsteder med mindst ét registreret forsøg eller en gennemført klatring.

## Forsøg og medier

- Et forsøg med billede/video registreres via media-servicen og øger projektets `attempts`.
- Et note-only-forsøg gemmes via projekt-API'et med `attempt=true` og øger `attempts` uden medie.
- Medier hentes separat via `/api/projects/:id/media` og vises i den visuelle arbejdslog.

## Tests

- API-tests dækker projektopdatering og validering.
- Komponenttests dækker projektflow, media-upload og profilrelaterede UI-flows.
- E2E-testen dækker oprettelse, redigering, forsøg og medie-upload gennem brugergrænsefladen.

## Sessioninvitationer

1. Værten åbner **Sessioner** og opretter en session. Forbindelser kan vælges under oprettelsen eller inviteres senere inde på `/session/[shareId]`. Klienten viser kun accepterede `CONNECTED_WITH`-forbindelser; følgere og brugere, som værten følger, vises ikke i vælgeren.
2. `POST /api/sessions` gentager adgangskontrollen server-side. Samtlige `inviteeIds` skal tilhøre accepterede forbindelser, og modtagerens invitationsindstilling skal tillade invitationen.
3. Sessionen gemmes som `ClimbingSession` med et tilfældigt `shareId`. Hver direkte invitation gemmes som en `INVITED_TO`-relation med status `pending`.
4. Det offentlige link `/session/[shareId]` viser sessionens tidspunkt, sted, eventuelle projekt og aktuelle deltagere. Deltagerlisten hentes løbende igen på klienten.
5. Modtagerens dashboard viser ulæste, afventende invitationer i sektionen **Sessioninvitationer**. Første version er alene en intern dashboardnotifikation; e-mail og push er ikke en del af flowet endnu.
6. `PATCH /api/sessions/[shareId]/invitation` accepterer eller afslår invitationen. Handlingen sætter både `respondedAt` og `readAt`; ved accept tælles brugeren med i sessionens deltagere, og notifikationen fjernes fra dashboardet.

### Testdækning for sessioner

- API-tests dækker oprettelse, inputvalidering, forbindelseskravet, modtagerens fravalg og håndtering af invitationer.
- Komponenttests dækker invitationsvælgeren, dashboardsektionen, sessionlinket og accept/afslag.
- E2E-testen dækker: opret forbindelse → opret session → invitér forbindelse → log ind som modtager → acceptér på dashboardet → se modtageren i deltagerlisten.
