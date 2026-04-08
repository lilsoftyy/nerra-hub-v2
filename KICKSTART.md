# KICKSTART — Første oppgave for Nerra Hub-bygging

Denne filen beskriver den første oppgaven agenten skal utføre i `nerra-hub`-repoet. Den leses én gang, ved oppstart av første sesjon. Etter at kickstart er fullført, arbeider agenten videre basert på spec-en og CLAUDE.md.

---

## Oppgave 1: Orientering og bekreftelse

**Før du skriver én linje kode**, gjør følgende i rekkefølge:

### Steg 1.1 — Les CLAUDE.md
Les hele `CLAUDE.md` i repo-roten. Dette er de persistente reglene som gjelder for hele prosjektet.

### Steg 1.2 — Orienter deg i spec-en
Åpne `teknisk-spesifikasjon-nerra-hub-v1_7-FROZEN.md` og les:
- Seksjon 1 (Formål)
- Seksjon 2 (Stack-oversikt, inkludert 2.1, 2.2, 2.3)
- Seksjon 3.1 (Datamodell-prinsipper)
- Seksjon 4.1 (Service role-grenser)
- Seksjon 6.5.1 (Proposal-eksekvering — flyt og status-semantikk)
- Seksjon 7.1 (Mappestruktur)
- Seksjon 11.5 (Migrasjoner må være bakoverkompatible)
- Seksjon 12 (Byggerekkefølge)

Ikke les hele spec-en nå. Bruk den som referansedokument når du trenger detaljer.

### Steg 1.3 — Les eksekverings-designet
Åpne `docs/superpowers/specs/2026-04-08-nerra-hub-execution-design.md`. Dette beskriver hvordan vi bygger Hub med Claude Code — fase-modellen, parallelle agenter, og kontekst-hygiene.

### Steg 1.4 — Bekreft forståelse
Skriv en kort oppsummering (maks 20 linjer) til Magnus der du bekrefter:

1. De tre viktigste arkitekturvalgene du har forstått
2. Hvilken fase du skal begynne på (Fase 0 — Hub-fundamentet)
3. Hvilke spørsmål du har om oppsettet (hvis noen)

**Vent på Magnus' respons før du går videre.** Ikke skriv kode, ikke opprett filer, ikke installer pakker før Magnus har godkjent at du har forstått riktig.

---

## Oppgave 2: Plan for Fase 0 (etter Magnus' godkjenning av Oppgave 1)

Når Magnus har bekreftet at forståelsen din er riktig, gjør følgende:

### Steg 2.1 — Bruk `writing-plans`-skillet
Aktiver `writing-plans`-skillet fra Superpowers. Bryt Fase 0 fra spec-seksjon 12 ned i bite-sized tasks.

Fase 0 består av (se spec 12 og CLAUDE.md seksjon 11 for detaljer):
- pnpm workspace, Turbo, ESLint, Prettier, TypeScript strict mode
- Next.js-skjelett for `apps/hub` med shadcn/ui
- Tomme pakker: `packages/db`, `packages/agents-sdk`, `packages/ui`, `packages/config`
- Auth med Google OAuth + e-post-whitelist
- Tomt dashboard som viser "Innlogget som Magnus"
- Vercel deploy fra `main` (gratis Vercel-domene i starten)
- Sentry koblet til (eu.sentry.io)
- `/api/health`-endepunkt fungerer
- CLAUDE.md med prosjektkonvensjoner
- CI pipeline: lint + typecheck (GitHub Actions)

### Steg 2.2 — Presenter planen
Vis planen til Magnus i korte seksjoner. Hver seksjon skal inneholde:
- Hva som skal gjøres (en setning)
- Hvilke filer som opprettes eller endres
- Hvilken verifikasjon som gjøres når det er ferdig

Vent på godkjenning per seksjon eller for hele planen samlet — Magnus avgjør.

### Steg 2.3 — Flagg åpne beslutninger
Fase 0 har ting Magnus må gjøre manuelt:
- **Supabase-prosjekt:** Kan opprettes via MCP-forbindelse hvis tilgjengelig, ellers manuelt av Magnus. EU-Frankfurt region.
- **Vercel-prosjekt:** Magnus kobler GitHub-repo til Vercel. Gratis Vercel-domene i starten, eget domene senere.
- **Google OAuth credentials:** Magnus oppretter i Google Cloud Console. Få client ID og secret.
- **Sentry-prosjekt:** Magnus oppretter på eu.sentry.io. Få DSN.

Lag en sjekkliste i planen som Magnus kan krysse av mens han setter opp disse eksterne tjenestene.

---

## Oppgave 3: Implementering (etter Magnus' godkjenning av planen)

Når planen er godkjent, bruk `subagent-driven-development`-skillet til å implementere Fase 0 task for task. For hver task:

1. Skriv failing test(er) først (TDD)
2. Implementer minimum for å gjøre testen grønn
3. Kjør `verification-before-completion`-skillet før du markerer task som ferdig
4. Oppsummer kort til Magnus hva som er gjort, hva som gjenstår

**Ikke commit til main direkte.** Bruk `using-git-worktrees`-skillet for isolert branch per task-cluster, og åpne PR for merge.

---

## Regler under hele kickstart

- **Stop og spør ved tvil.** Hvis noe i CLAUDE.md eller spec-en er uklart, flagg det i stedet for å gjette.
- **Ikke installer pakker uten å si hva du installerer.** Vis kommando og versjon før du kjører.
- **Ikke modifiser `CLAUDE.md` eller spec-en selv.** De er låst av Magnus. Foreslå endringer hvis du finner feil, men ikke rediger.
- **Respekter TDD-kravet.** Skriv alltid failing test før implementering.
- **Husk Magnus dikterer via Wispr Flow.** Småfeil i hans meldinger er transkripsjon, ikke intensjon. Tolk velvillig.
