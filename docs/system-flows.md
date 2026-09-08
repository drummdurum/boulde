# Boulde – systemflows

## Projekt → gennemført → profil

1. Brugeren vælger statusen `Gennemført` i projektets redigering eller ved et nyt forsøg.
2. Klienten sætter fremdrift til `100`.
3. `PATCH /api/projects` gemmer status og fremdrift på Neo4j-projektet.
4. Profilen henter brugerens projekter via `getUserProjects`.
5. Projekter med status `Gennemført` tælles i profilstats og vises under **Klatrehistorik**.

## Forsøg og medier

- Et forsøg med billede/video registreres via media-servicen og øger projektets `attempts`.
- Et note-only-forsøg gemmes via projekt-API'et med `attempt=true` og øger `attempts` uden medie.
- Medier hentes separat via `/api/projects/:id/media` og vises i den visuelle arbejdslog.

## Tests

- API-tests dækker projektopdatering og validering.
- Komponenttests dækker projektflow, media-upload og profilrelaterede UI-flows.
- E2E-testen dækker oprettelse, redigering, forsøg og medie-upload gennem brugergrænsefladen.
