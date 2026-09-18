# Vægkort

Første kort vises på `/klatresteder/sydhavn` via den almindelige navigation og på `/steder/boulders-kbh-sydhavn`. Det følger brugerens skitse af København Syd. Midtervæg og Højre væg er foreløbige navne.

Kortet er opdelt efter den opdaterede skitses røde streger: fire sektioner til venstre, tre langs overhænget, fire på Skibet, to på midtervæggen og én til højre. På Skibet står V1/H1 for venstre/højre øverst og V2/H2 for venstre/højre nederst; knapperne viser fulde navne. Den lodrette kant ved x=779 er ikke en klatrevæg og er kun en dekorativ streg uden klikmål. Skillelinjer er stiplede.

Gamle placeringer med område-ID skibet/overhang/kaosvaeg/center-wall oversættes til en ny sektion ved visning ud fra deres eksisterende koordinater. Databasen ændres ikke, og markøren flyttes ikke. Nye projekter gemmer de nye sektions-ID'er. Koordinatsystemet er uændret.

`components/gym-map/copenhagen-south.ts` indeholder geometri og stabile område-ID'er. `GymMap` håndterer valg via touch, mus og tastatur. I Nyt projekt vises hallens kort automatisk via `lib/gym-maps.ts`. Indtil videre findes kun Sydhavn-kortet. Placering er valgfri og ryddes ved skift af hal.

Projektplacering gemmes som `mapArea`, `mapX` og `mapY` på Project-noden og returneres som `mapPlacement`. X/Y er procenter af viewBox 1072 × 740. SVG-klik bruger inverse screen CTM; knapper og tastatur placerer markøren ved et fast punkt på sektionens væg som udgangspunkt. API'et validerer hallens område-ID og koordinater fra 0 til 100. Gemte placeringer vises i projektdetaljen efter genindlæsning. Eksisterende projekter uden placering virker fortsat.

## Plan for placering og vægskift

Kortet viser én farvet prik pr. fysisk problem. Klik viser projekt og bruger; områdelisten viser alle offentlige projekter, også når flere brugere arbejder på samme problem.

Dashboardets projekter fra fulgte klatrere åbner et popupkort via projektnavnet eller knappen “Se placering på kort”, når projektet har en placering i en understøttet hal. Kortet fremhæver sektionen og viser den gemte placering samt links til projekt og hal. Dialogen kan lukkes med knappen, Escape eller klik på baggrunden. Projekter uden kortplacering linker direkte til projektdetaljen.

Korttestbrugerne følger hinanden, så deres dashboard også demonstrerer kortet for fulgte klatreres projekter.

Hver sektion har to pladser af hver farve (fx Grøn 1 og Grøn 2). Nyt projekt kræver valg af plads ved kortplacering. Eksisterende pladser genbruger problemets placering og farve. `MapProblem` har et unikt ID ud fra hal, sektion, farve og plads; flere brugeres projekter kan henvises til det samme problem via `ON_PROBLEM`. Grænsen gælder fysiske problemer, ikke antallet af brugerprojekter. Gennemført frigiver ikke en plads. Ældre projekter uden problem-ID bevarer deres placering.

`npm run db:seed:map` opretter tre testbrugere og 42 offentlige testprojekter: to grønne og ét blåt pr. sektion. Scriptet kan køres igen uden dubletter og overskriver ikke eksisterende projekter. I det lokale Docker-miljø køres det med `docker compose -f ../compose.yml exec -T web node scripts/seed-gym-map.mjs`. Testlogin: `korttest_alma@test.boulde.local`, `korttest_jonas@test.boulde.local` eller `korttest_freja@test.boulde.local`, alle med adgangskoden `Test1234!`.

Placering er implementeret; registrering af omskruinger og arkivering er fortsat et senere datatrin.

Et område er en fysisk væg; dets ID ændres ikke ved ugentlige omskruinger. Ved næste datatrin skal en omskruning have sit eget ID, som projektets placering henviser til. Det skelner gamle problemer fra nye på samme væg og undgår, at en forsinket arkivering fjerner nye problemer.

Et fjernet problem skal arkiveres frem for slettes. Tilgængelighed (aktiv/fjernet) er separat fra brugerens fremskridt (Ny/Arbejder på den/Tæt på/Gennemført). Forsøg, noter, medier og gennemførelser bevares. Arkiverede problemer udelades fra det aktive kort og kan findes i historikken.

Ingen automatisk ugentlig arkivering er implementeret: kalenderen alene afgør ikke, hvilke problemer der faktisk er fjernet. Afklar senere hvem der registrerer vægskift, hvordan de bekræftes, og hvordan fejl fortrydes. En handling, der gælder andre brugeres projekter, kræver særskilt autorisation og må ikke gives til almindelige projekt-ejere.
