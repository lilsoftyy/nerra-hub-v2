# CLAUDE.md — Nerra Hub utviklingskontekst

Denne filen leses av AI-agenten ved hver tur. Den er bevisst kompakt. Detaljer finnes i `teknisk-spesifikasjon-nerra-hub-v1_7-FROZEN.md` (refereres som "spec-en" nedenfor).

---

## 1. Hvem og hva

**Prosjekt:** Nerra Hub — internt kommandosenter for Nerra AS.
**Brukere:** Magnus Skarpaas Andersen (CEO) og Martin Skarpaas Andersen (medgründer). Aldri flere. Aldri planlegg for flere.
**Kontekst:** Drone Wash Academy er Nerras første produkt (B2B-konsulent for fasadevask med drone). Hub er interne verktøy, ikke kundevendt.
**Arbeidsspråk:** Kode er engelsk. UI-tekst er norsk (bokmål). Dokumentasjon er norsk. Kontrakter og kundemateriell oversettes til engelsk før levering.
**Utviklingsverktøy:** Claude Code (Opus 4.6). Fase 0a (Modal dev-agent) er hoppet over — Claude Code er utvikleragenten.

---

## 2. Autoritativ kilde

**Spec-en (`teknisk-spesifikasjon-nerra-hub-v1_7-FROZEN.md`) er frozen og autoritativ.**

Regler:
- Hvis noe i denne CLAUDE.md motsier spec-en, følger du spec-en og flagger motsigelsen.
- Hvis noe ikke er dekket av spec-en, spør før du tar arkitektoniske valg.
- Hvis du finner et hull i spec-en som blokkerer implementering, flagg det i stedet for å gjette.
- Les spec-ens relevante seksjon før du begynner på et nytt modul-sett. Arbeid ikke fra hukommelsen om hva du tror står der.

**Spec-indeks — finn rett seksjon raskt:**

| Tema | Seksjon |
|---|---|
| Stack, database-klienter, connection pooling, modellregion | 2.1, 2.2, 2.3 |
| Datamodell-prinsipper og enum-typer | 3.1, 3.2 |
| Tabelldefinisjoner (alle) | 3.3.1 — 3.3.25 |
| Database-triggere | 3.4 |
| Row Level Security (RLS-maler A, B, C) | 4.1, 4.2, 4.3 |
| Realtime-restriksjoner | 4.4 |
| Auth (Hub, Agent-API, kvalifiseringsskjema, kontraktvisning) | 5.1 — 5.4 |
| Agent-API-katalog, RBAC-matrise, rate limiting | 6.1 |
| Webhooks og Tripletex-sync | 6.2 |
| Realtime-kanaler | 6.3 |
| Helsesjekk-endepunkt | 6.4 |
| **Proposal-eksekvering (kritisk)** | 6.5 (alle underseksjoner) |
| Mappestruktur | 7.1 |
| Miljøvariabler (Hub + Modal) | 8.1, 8.2 |
| Observability, logging, alarmer | 9.1 — 9.5 |
| GDPR, retention, backup | 10.1 — 10.4 |
| Lokal utvikling, deploy, CI/CD, migrasjoner, SDK-versjonering | 11.1 — 11.6 |
| Byggerekkefølge (faser) | 12 |
| Åpne beslutninger og udefinerte områder | 13, 14 |

**Eksekverings-design:** `docs/superpowers/specs/2026-04-08-nerra-hub-execution-design.md` — beskriver hvordan vi bygger Hub fase for fase med Claude Code.

---

## 3. Arkitekturprinsipper (uforanderlige)

Disse prinsippene må aldri brytes uten at du eksplisitt har fått tillatelse fra Magnus:

1. **Agent-first.** Alle datamodeller, API-er og flows er designet med AI-agenter som primærbrukere, ikke som påbygg.
2. **Mennesker i sløyfen.** Agenter foreslår, mennesker godkjenner. Alt som går ut til kunder utføres av et menneske.
3. **To database-klienter.** `@supabase/supabase-js` for CRUD, Realtime, Storage, Auth. `postgres` (porsager/postgres) via `lib/db/transactional.ts` for transaksjoner, låsing, rate limiting, auth-nonces. Se spec 2.1.
4. **Service role kun Hub server-side.** Aldri i Modal, aldri i klient, aldri i React-komponenter. ESLint-regel håndhever dette.
5. **Agent-API er eneste vei til data for Modal-agenter.** Modal har ingen direkte Supabase-tilgang, ingen service role, ingen Gmail-credentials.
6. **Proposal-eksekvering bruker direkte `postgres`-driver**, ikke Supabase-klienten. Transaksjoner med `db.begin(async (sql) => ...)` og template literals. Se spec 6.5.3.
7. **Proposal-status-semantikk er hellig.** `rejected` = mennesket sa nei. `execution_failed` = mennesket sa ja men feil skjedde. Aldri bland disse. Se spec 6.5.1.
8. **`closed_at` eies av trigger.** Aldri sett det manuelt i handler-kode.
9. **Agenter kan aldri foreslå bakover-faseoverganger.** Agent-API returnerer 403 `agents_cannot_propose_backward_transitions`. Kun mennesker oppretter bakover-forslag manuelt fra UI.
10. **Soft delete via helper-funksjoner.** All kode mot soft-deletable tabeller går via `packages/db/src/queries.ts` (`activeCompanies()` osv.), aldri direkte Supabase-kall.

---

## 4. Kodekonvensjoner

- **TypeScript strict mode** på alle apper og pakker. Ingen `any` uten kommentar som forklarer hvorfor.
- **Filer:** kebab-case (`customer-card.tsx`)
- **Komponenter:** PascalCase (`CustomerCard`)
- **Hooks:** camelCase med `use`-prefiks (`useCompany`)
- **Server actions:** camelCase med verb-prefiks (`updateCompanyPhase`)
- **Database:** snake_case
- **API-ruter:** kebab-case
- **UUID v7** genereres app-side med `uuid`-pakken (`uuidv7()`). Aldri database-default, aldri UUID v4.
- **Norsk UI-tekst, engelsk kode.** Mapping skjer i komponenter.
- **Norsk tekst MÅ bruke æ, ø, å korrekt.** Aldri skriv "a" for "å", "o" for "ø", "ae" for "æ". Dette gjelder overalt: UI-komponenter, Slack-meldinger, feilmeldinger, placeholder-tekst, agent-svar. Dobbeltsjekk ALL norsk tekst i kode du skriver.
- **Ingen emojis** i kode, commits eller UI med mindre Magnus eksplisitt ber om det.
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

---

## 5. Forbudte mønstre

Gjør ALDRI disse tingene:

- Import av `lib/supabase/service.ts` fra noe annet enn `api/agent/**`, `api/webhooks/**`, `api/cron/**`, `api/agent-auth/**`
- Bruk av Supabase-klienten for transaksjonelt arbeid (`db.from(...).update(...)` i proposal-handlere) — bruk `postgres`-driveren
- Sett `closed_at` manuelt — trigger eier det
- Marker proposal som `rejected` ved eksekveringsfeil — bruk `execution_failed`
- Lagre Gmail OAuth refresh tokens noe annet sted enn Hub server-side env
- Bruk av `localStorage` eller `sessionStorage` i klient-kode
- Bruk av `console.log` direkte — bruk `safeLogger` i `lib/logger.ts`
- Logge e-post, telefon, tokens, HMAC-nøkler eller seeds — se spec 9.2.1
- Direkte Supabase-kall mot soft-deletable tabeller uten `activeXxx()`-helper
- Legg til nye enum-verdier uten migrasjon
- Skriv kode uten failing test først (se TDD-krav i seksjon 7)

---

## 6. Superpowers — du har dem, bruk dem

Disse skillene er obligatoriske for relevante oppgaver:

**Bruk ved nye implementerings-oppgaver:**
- `writing-plans` — bryter spec-en ned i bite-sized tasks med eksakte filstier, kode og verifikasjon
- `subagent-driven-development` — dispatcher en frisk subagent per task med to-stegs review
- `using-git-worktrees` — isolert workspace per task

**Bruk ved feilsøking:**
- `systematic-debugging` — 4-fase root cause-prosess før noe fikses

**Bruk før du hevder "ferdig":**
- `verification-before-completion` — kjør tester, linter, bygg før du påstår noe funker

**Brainstorming skal KUN brukes på:**
- Åpne punkter i spec-seksjon 14
- Detaljer spec-en eksplisitt lar være udefinerte (f.eks. `POST /api/agent/search`-format, recurring tasks-logikk, kvalifiseringsskjema-feltsett)

**Brainstorming skal ALDRI brukes på:**
- Arkitekturvalg som allerede er bestemt i spec-en
- Datamodell, auth, proposal-flyt, RLS, integrasjoner — disse er frozen
- Spørsmål som kan besvares ved å lese spec-en

Hvis du er i tvil om et valg er "frozen" eller "åpent", sjekk spec-seksjon 14 først. Hvis det ikke står der, spør Magnus.

---

## 7. TDD-krav

Hver handler, hver API-endpoint, hver helper-funksjon skal ha:

1. **En failing test først** som beskriver forventet oppførsel
2. **Minimum implementering** som får testen til å gå grønn
3. **Refactor** hvis nødvendig, uten å endre test-oppførsel
4. **Verifikasjon** at alle relaterte tester fortsatt passerer

Bruk Vitest for enhetstester, Vitest + Supabase test container for kontrakttester mot database, Playwright for E2E på kritiske flyter.

Test-strategi detaljert i spec-seksjon 9.5.

---

## 8. Magnus' arbeidsmåte

- Magnus dikterer ofte via Wispr Flow. Tolk intensjon, ikke ordlyd — småfeil, manglende tegnsetting eller nesten-riktige ord skyldes transkripsjon, ikke mening.
- Magnus er ikke teknisk. Kommuniser med klare utfall, ikke teknisk sjargong.
- Magnus foretrekker å sparrre før kode skrives. Bruk `brainstorming`-skillet der det er passende (se seksjon 6 over for grenser).
- Magnus foretrekker direkte feedback, ikke motivasjonsprat. Ingen emojis, ingen overdreven positivitet.
- Magnus vil vite når ting er usikkert. Ikke gjett, flagg.
- Magnus vil se visuelle prototyper, ikke bare beskrivelser, for frontend-arbeid.
- Standard font for alle Word-dokumenter til Magnus er "Google Sans Flex".
- Martin omtales alltid som "medgründer" (co-founder), aldri "medeier" (co-owner).

---

## 9. Forventet arbeidsflyt per oppgave

1. **Les relevant spec-seksjon** (bruk indeksen i seksjon 2 over)
2. **Kjør `writing-plans`-skillet** hvis oppgaven er ny eller kompleks
3. **Vis planen til Magnus** og vent på godkjenning
4. **Kjør `subagent-driven-development`** med TDD for implementering
5. **Kjør `verification-before-completion`** før du påstår ferdig
6. **Oppsummer hva som er gjort, hva som gjenstår, eventuelle åpne spørsmål**

Ikke hopp over steg 3. Magnus godkjenner alltid planen før kode skrives.

---

## 10. Hva du skal gjøre akkurat nå

Les `KICKSTART.md` for den første konkrete oppgaven. Hvis `KICKSTART.md` ikke finnes eller allerede er fullført, spør Magnus hva du skal starte med.

---

## 11. Fase-nummerering

Spec-seksjon 12 snakker om "Fase 0a" og "Fase 0b". Fase 0a (Modal dev-agent) er droppet — Claude Code er utvikleragenten. Den nye rekkefølgen:

| Gammel spec-nummerering | Ny | Beskrivelse |
|---|---|---|
| ~~Fase 0a~~ | **Droppet** | Claude Code er utvikleragenten |
| Fase 0b | **Fase 0** | Hub-fundamentet: tomt repo, Next.js, Supabase, auth, deploy |
| Fase 1–5 | Fase 1–5 | Som i spec-en |

Hvis spec-en sier "Fase 0b", mener vi nå bare "Fase 0".
