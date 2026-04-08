# Teknisk spesifikasjon: Nerra Hub

**Versjon:** 1.7
**Dato:** April 2026
**Forfatter:** Magnus Skarpaas Andersen
**Status:** FROZEN
**Relatert dokument:** PRD: Nerra Hub v2.0, Drift-runbook (stub)

**Endringer fra v1.6:** Codex og Claude Code fant at v1.6 introduserte to-klient-arkitekturen og ny status-enum, men ikke gjennomførte dem konsekvent gjennom hele dokumentet. Denne versjonen lukker disse inkonsekvensene og noen mindre hull. Etter endelig review-runde fra begge anmeldere ble fire mindre observasjoner også tatt inn (markert *post-review* under).

- **`rejected` → `execution_failed`** ved tekniske eksekveringsfeil i 6.5.3 og 6.5.6 (begge anmeldere)
- **ExecutionContext og eksempelkode skrevet om** til å faktisk bruke `postgres`-driveren med template literals (begge anmeldere)
- **`DATABASE_POOL_URL`** lagt til som server-only env-var med konkret konfigurasjonseksempel for `postgres`-klienten mot transaction-mode pooler (Codex)
- **Realtime-kanal `proposals_active`** utvidet til å streame `pending_approval`, `approved_pending_execution`, og `execution_failed` så UI får live updates ved status-endring (Codex)
- **Watchdog for stuck eksekveringer** i system-purge-cron: proposals med `approved_pending_execution` eldre enn 10 min markeres `execution_failed` med `execution_timeout` (begge anmeldere)
- **Gmail-auth flyttet til Hub** – `GMAIL_OAUTH_REFRESH_TOKEN` er nå Hub server-side env-var, ikke Modal. `executeEmailDraft` kaller Gmail API direkte fra Hub (Codex)
- **Mappestruktur utvidet** med `api/cron/`, `api/agent-auth/`, `api/health/`, `lib/db/`, `lib/proposals/executors/` med alle handler-filer eksplisitt listet (Claude Code)
- **`calendar_events` lagt til i Realtime-oversikten** som "Nei" (poller daglig) (Claude Code)
- **`draft` fjernet fra `proposal_status`-enum** – var aldri brukt (Claude Code)
- **Recovery-flyt for `execution_failed`** dokumentert: Magnus kan klikke "Prøv igjen", "Avvis" eller "Eskaler" (Claude Code)
- **Eksekveringshandlere fase-plassert** i seksjon 6.5.2 (hvilken handler som bygges i hvilken fase) (Claude Code)
- **6.4 seksjonsnummer fikset** – Helsesjekk er nå 6.4, Proposal-eksekvering 6.5 (Claude Code)
- ***post-review*: `gmail_draft_id`-presisering** i 3.3.9 – feltet settes av Hub under eksekvering, ikke av agenten, fordi agenter ikke har Gmail-credentials (Claude Code O1)
- ***post-review*: `executed_at` semantikk dokumentert** – feltet betyr "eksekvering avsluttet uavhengig av utfall", brukes både for vellykket og feilet (Codex obs 2)
- ***post-review*: `min_supported_sdk_version`** lagt til i `/api/health`-eksemplet i 6.4 for å matche 11.6 (Codex obs 3)
- ***post-review*: Avvis etter `execution_failed`-semantikk** dokumentert eksplisitt i 6.5.8 – `rejected` brukes også her, audit-sporet bevarer skillet implisitt via `execution_error`-feltet (Codex obs 1)

---

## 1. Formål

Dette dokumentet oversetter PRD-en for Nerra Hub til konkrete tekniske valg som utvikleragenter kan implementere uten å gjette. Det dekker datamodell, API-kontrakter, autentisering, mappestruktur, miljøvariabler og byggerekkefølge.

PRD-en svarer på *hva* Hub skal være. Dette dokumentet svarer på *hvordan* den bygges.

---

## 2. Stack-oversikt

| Lag | Teknologi | Versjon | Begrunnelse |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Vercel-standard, langsiktig støtte |
| Frontend-rammeverk | Next.js (App Router) | 15.x | Server components, RSC, edge-støtte |
| Språk | TypeScript | 5.x | Strict mode, ingen `any` uten kommentar |
| Styling | Tailwind CSS | 4.x | Standardvalg, raskt å iterere |
| UI-komponenter | shadcn/ui | Siste | Eier komponentene selv, ingen tung deps |
| Database | Supabase Postgres (EU-Frankfurt) | 15+ | EU-region for GDPR |
| Database-klient (CRUD) | `@supabase/supabase-js` | Siste | REST-wrapper for vanlig CRUD, Realtime, Storage |
| Database-klient (transaksjonelt) | `postgres` (porsager/postgres) | 3.x | Direkte Postgres for låsing, transaksjoner, `for update skip locked` |
| Auth | Supabase Auth + Google OAuth | – | Kun magnus@/martin@nerra.com |
| Storage | Supabase Storage | – | For dokumenter, opptak, generert PDF |
| Realtime | Supabase Realtime | – | Live-oppdatering av godkjenningskø, agentside |
| Deployment frontend | Vercel (EU-region) | – | Pull-request previews, auto-deploy main |
| Agent-runtime | Modal | – | Langvarige jobber, køer, retries |
| Pakkebehandler | pnpm | 9.x | Raskere enn npm, deterministisk |
| Linting | ESLint + Prettier | Siste | Standard Next.js-config + Tailwind plugin |
| Testing | Vitest + Playwright | Siste | Enhetstest + E2E |
| Feilrapportering | Sentry | – | Frontend + serverside |
| Observability | Vercel Analytics + Supabase Logs | – | MVP-nivå, utvides senere |

**Repo-strategi:** Monorepo med pnpm workspaces. Ett repo, flere apper:
```
nerra-hub/
  apps/
    hub/                  # Next.js-frontenden
    qualification-form/   # Kvalifiseringsskjema (egen Next.js-app, samme repo)
  packages/
    db/                   # Supabase-typer, migrasjoner, klient-helpere
    agents-sdk/           # Felles SDK som agenter bruker mot Hub-API
    ui/                   # Delte UI-komponenter
    config/               # Delt ESLint, TypeScript, Tailwind
```

Modal-koden bor i et **separat repo** (`nerra-agents`) fordi runtime, deploy-prosess og avhengigheter er fundamentalt forskjellige fra Next.js-koden. De to reposene snakker sammen via Hub-API og webhooks.

### 2.1 To database-klienter

Hub bruker **to forskjellige database-klienter** for samme Supabase Postgres-database. Hver har sin nisje.

**Klient 1 – `@supabase/supabase-js` (REST-basert):**
- Brukes for: vanlig CRUD, Realtime-abonnementer, Storage, Auth
- Honorerer RLS automatisk
- Ikke i stand til å gjøre `select ... for update skip locked`, kun begrenset transaksjonsstøtte
- Lever i `apps/hub/lib/supabase/{server.ts, client.ts, service.ts}`

**Klient 2 – `postgres` (porsager/postgres, direkte driver):**
- Brukes for: alle operasjoner som krever ekte transaksjoner eller Postgres-låsing
  - Proposal-eksekvering (seksjon 6.5)
  - Agent-kø-låsing med `for update skip locked` (seksjon 3.3.12)
  - Sentralisert rate limiting (seksjon 6.1.2)
  - Auth-nonce one-time-use atomicity (seksjon 5.2.2)
- Bypasser RLS – brukes kun fra service-role-kontekst
- Type-sikker via TypeScript-template-strenger
- Lever i `apps/hub/lib/db/transactional.ts`
- Bruker Supabase **transaction-mode connection pooler** (port 6543, ikke 5432) for serverless compatibility

**Hvorfor to klienter:**
Supabase REST-klienten dekker 90% av behovet og er enklest. Men proposal-eksekvering, kø-låsing og rate limiting krever Postgres-primitiver REST-klienten ikke eksponerer. Heller enn å skrive alt som Postgres-funksjoner (RPC), holder vi logikken i TypeScript der den er lettere å teste og typesjekke, og bruker direkte Postgres-driver kun for de spesifikke flytene som trenger det.

**Konkret konfigurasjon (`apps/hub/lib/db/transactional.ts`):**

```ts
import postgres from 'postgres';

if (!process.env.DATABASE_POOL_URL) {
  throw new Error('DATABASE_POOL_URL er ikke satt');
}

export const db = postgres(process.env.DATABASE_POOL_URL, {
  // Transaction mode: én pooled connection per transaksjon, ingen prepared statements
  prepare: false,
  // Maks antall samtidige connections fra denne Vercel-instansen
  max: 10,
  // Idle timeout før connection lukkes (sekunder)
  idle_timeout: 20,
  // Maks levetid på en connection (sekunder) – tving recycling for å unngå stale connections
  max_lifetime: 60 * 30,
  // SSL kreves mot Supabase
  ssl: 'require',
  // Connection-feil i Vercel serverless: returner raskt
  connect_timeout: 10,
});
```

`DATABASE_POOL_URL` hentes fra Supabase Dashboard under **Settings → Database → Connection pooling → Transaction mode**. Den ser slik ut: `postgres://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`.

### 2.2 Connection pooling

Vercel serverless skaper mange korte connections. Supabase tilbyr to pooler-modi:
- **Transaction mode (port 6543):** Hver transaksjon får en pooled connection. Ingen prepared statements, ingen LISTEN/NOTIFY. Rett valg for serverless.
- **Session mode (port 5432):** Tradisjonell connection per session. Rett for langlevende prosesser.

Hub bruker **transaction mode** for alle direkte Postgres-kall. Begrensninger (ingen prepared statements) er ikke et problem for våre use cases. Detaljert pgbouncer-konfigurasjon dokumenteres i drift-runbook.

### 2.3 Modellregion og dataflyt mot LLM-leverandører

All *lagring* av kundedata skjer i Supabase EU-Frankfurt. All *behandling* via LLM-er skjer mot Anthropic og OpenAI sine direkte API-er (US-region) under EU-US Data Privacy Framework.

**Hva dette betyr i praksis:**
- Kundedata bor i EU og forlater aldri EU permanent
- Når en agent jobber, sendes nødvendige biter (firmanavn, e-postutkast, møteoppsummering osv.) som en transient request til Anthropic/OpenAI
- Begge leverandører har zero data retention-avtaler tilgjengelige – data lagres ikke hos leverandøren etter at responsen er returnert
- DPA-er må signeres med både Anthropic og OpenAI før produksjon
- Personvernerklæringen må eksplisitt nevne at AI-behandling skjer i USA under EU-US Data Privacy Framework

**Eskape hatch:**
Hvis en kunde fremover stiller krav om EU-only AI-behandling, er rømningsruten å bytte fra direkte Anthropic API til Claude via AWS Bedrock i `eu-central-1` (Frankfurt). Dette er estimert til 1–2 dagers arbeid – bare modell-klient-laget i `packages/agents-sdk` må endres. Tilsvarende finnes Azure OpenAI i EU-region for OpenAI-modeller. Vi bygger ikke for dette nå, men holder agent-SDK-et abstrahert nok til at byttet er mulig.

**Lokale modeller** (Ollama, llama.cpp) er eksplisitt utenfor scope. Kvalitetsgapet til Claude Sonnet/Opus er for stort til å støtte filosofien "kvalitet over kost", og lokal modell krever at Mac-en er våken for at agentene skal jobbe – noe som kolliderer med 24/7-Modal-arkitekturen.

---

## 3. Datamodell

### 3.1 Prinsipper

- **UUID v7** som primærnøkler (sortable, ingen lekking av sekvens). Genereres **app-side i TypeScript** med `uuid`-pakken (v9+, `uuidv7()`-funksjon). Kolonnene har ingen `default value` – appen må alltid sette ID. Postgres 15 har ikke innebygd støtte for UUID v7 (kommer i Postgres 18). Vi bruker ikke `pg_uuidv7`-extension for å minimere avhengigheter. Zod-skjemaer i `packages/agents-sdk` validerer at insert har en gyldig UUID v7.
- **`created_at` og `updated_at`** på alle tabeller, satt av database (triggere)
- **Soft delete** via `deleted_at` på kunde- og dokumentdata. Hard delete kun ved GDPR-sletting. Alle spørringer mot soft-deletable tabeller filtrerer på `deleted_at is null` som standard. Hver slik tabell har en partiell indeks: `create index ... where deleted_at is null` for å holde standardspørringer raske. **Håndhevelse:** All applikasjonskode bruker helper-funksjoner i `packages/db/src/queries.ts` (`activeCompanies()`, `activeContacts()` osv.) som har filteret innebygd. Direkte Supabase-kall mot soft-deletable tabeller er ikke tillatt – ESLint-regel og code review fanger brudd
- **Enum-typer i Postgres** for alt med begrenset verdimengde (faser, prioritet, agentstatus)
- **Snake_case** i database, **camelCase** i TypeScript (auto-mapping via Supabase typegen)
- **Foreign keys alltid med `on delete`-strategi** definert eksplisitt

### 3.2 Enum-typer

```sql
create type customer_phase as enum (
  'lead',
  'qualification',
  'sales',
  'onboarding',
  'training',
  'operational',
  'finished'
);

create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high', 'critical');
create type task_category as enum ('sales', 'training', 'admin', 'development', 'research', 'other');

create type proposal_status as enum (
  'pending_approval',
  'rejected',                       -- Magnus eller Martin sa nei
  'approved_pending_execution',     -- Mennesket godkjente, eksekvering pågår
  'executed',                       -- Eksekvering vellykket
  'execution_failed',               -- Mennesket godkjente, men eksekvering feilet
  'expired'                         -- Aldri besluttet før utløp
);

create type proposal_action_type as enum (
  'phase_transition',
  'task_creation',
  'customer_update',
  'calendar_event',
  'email_draft',
  'document_generation',
  'welcome_package',
  'bug_fix',
  'other'
);

create type document_kind as enum (
  'research',
  'customer_report',
  'welcome_package',
  'contract',
  'briefing',
  'other'
);

create type agent_run_status as enum ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled');

create type email_category as enum (
  'customer_lead',
  'customer_qualification',
  'customer_sales',
  'customer_onboarding',
  'customer_training',
  'customer_operational',
  'dwa_bug',
  'dwa_question',
  'dwa_certification',
  'partner',
  'other'
);

create type contract_status as enum ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired');

create type document_visibility as enum ('internal', 'customer_shareable');

create type alert_severity as enum ('info', 'warning', 'critical');
```

### 3.3 Tabeller

#### 3.3.1 `profiles`
Brukere av Hub. Fylles fra Supabase Auth via trigger. Bare to rader noensinne.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text unique not null | magnus@nerra.com / martin@nerra.com |
| `full_name` | text not null | – |
| `avatar_url` | text | – |
| `created_at` | timestamptz | – |

**RLS:** Kun innloggede brukere fra `@nerra.com`-domenet kan lese.

#### 3.3.2 `companies`
Firmaer Nerra jobber med eller har jobbet med.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `name` | text not null | Firmanavn |
| `country` | text not null | ISO 3166-1 alpha-2 |
| `operational_area` | text | Region/by der de jobber |
| `website` | text | – |
| `org_number` | text | Norsk orgnr eller utenlandsk ekvivalent |
| `employee_count` | int | Totalt i firmaet |
| `facade_team_size` | int | Antall i fasadevask |
| `facade_revenue_estimate` | numeric(12,2) | NOK eller EUR – se `facade_revenue_currency` |
| `facade_revenue_currency` | text | ISO 4217 (NOK, EUR, ...) |
| `facade_types` | text[] | Glass, betong, metall, ... |
| `current_methods` | text[] | lift, stige, tau |
| `phase` | customer_phase | Default `lead` |
| `closed_at` | timestamptz | Immutabelt tidsstempel satt når kunden flyttes til `finished`. Brukes som anker for GDPR-retention. Endres aldri etter at det er satt. |
| `flagged` | boolean | Default false – settes av agent |
| `flagged_reason` | text | – |
| `assigned_to` | uuid → profiles | Hovedansvarlig (Magnus eller Martin) |
| `notes` | text | Internt fritekstfelt |
| `created_at` | timestamptz | – |
| `updated_at` | timestamptz | – |
| `deleted_at` | timestamptz | Soft delete |

**Indekser:** `phase`, `country`, `flagged`, `assigned_to`, full-text på `name`.

#### 3.3.3 `contacts`
Kontaktpersoner – tilhører ett firma. N:1.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `company_id` | uuid FK → companies on delete cascade | – |
| `full_name` | text not null | – |
| `email` | text | – |
| `phone` | text | – |
| `role` | text | Stilling i firmaet |
| `linkedin_url` | text | – |
| `is_primary` | boolean | Hovedkontakt for firmaet |
| `is_training_contact` | boolean | Mottar opplæringskommunikasjon |
| `preferred_language` | text | ISO 639-1 (en, de, no, ...) |
| `notes` | text | – |
| `created_at` | timestamptz | – |
| `updated_at` | timestamptz | – |

**Constraint:** Maks én `is_primary = true` per `company_id`.

#### 3.3.4 `customer_dwa_details`
DWA-spesifikk info – 1:1 med `companies` (men separat tabell for å holde `companies` ren).

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `company_id` | uuid PK FK → companies | – |
| `selected_packages` | jsonb | `[{package: 'pilot', persons: 2}, ...]` |
| `existing_drone_experience` | text | Fritekst |
| `has_a1_a3` | boolean | – |
| `has_a2` | boolean | – |
| `has_sts01` | boolean | – |
| `equipment_owned` | text[] | – |
| `equipment_needed` | text[] | – |
| `target_start_date` | date | – |
| `pilots_to_train` | int | – |
| `updated_at` | timestamptz | – |

#### 3.3.5 `customer_economy`
Per-kunde-økonomi som vises på kundeprofilen. Hentes/synces fra Tripletex.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `company_id` | uuid PK FK → companies | – |
| `quoted_price` | numeric(12,2) | – |
| `currency` | text | – |
| `paid_amount` | numeric(12,2) | – |
| `outstanding_amount` | numeric(12,2) | – |
| `tripletex_customer_id` | text | – |
| `last_synced_at` | timestamptz | – |

#### 3.3.6 `tasks`

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `title` | text not null | – |
| `description` | text | – |
| `status` | task_status | Default `open` |
| `priority` | task_priority | Default `medium` |
| `category` | task_category | – |
| `company_id` | uuid FK → companies on delete set null | Valgfri |
| `assignee_id` | uuid FK → profiles on delete set null | NULL hvis tilordnet agent |
| `assignee_agent` | text | Agentnavn hvis ikke menneske |
| `due_date` | timestamptz | – |
| `recurrence` | jsonb | `{type: 'weekly', interval: 1, ...}` eller NULL |
| `created_by` | uuid FK → profiles | NULL hvis opprettet av agent |
| `created_by_agent` | text | – |
| `created_at` | timestamptz | – |
| `updated_at` | timestamptz | – |
| `completed_at` | timestamptz | – |

**Indekser:** `status`, `due_date`, `company_id`, `assignee_id`.

#### 3.3.7 `phase_checklist_items`
Forhåndsdefinerte oppgaver fra PRD seksjon 5.4. Hardkodet per fase.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `company_id` | uuid FK → companies on delete cascade | – |
| `phase` | customer_phase not null | – |
| `item_key` | text not null | F.eks. `qualification_form_received` |
| `label` | text not null | Norsk visningstekst |
| `completed` | boolean | – |
| `completed_at` | timestamptz | – |
| `completed_by` | uuid FK → profiles | – |
| `sort_order` | int | – |

**Constraint:** unique `(company_id, item_key)`. Items seedes når en company opprettes via en database-funksjon.

#### 3.3.8 `proposals`
Forslag fra agenter til mennesker – ryggraden i godkjenningskøen.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `agent_name` | text not null | F.eks. `agent_3_project` |
| `action_type` | proposal_action_type | – |
| `status` | proposal_status | Default `pending_approval` |
| `title` | text not null | Kort visningstekst |
| `description` | text | Lengre forklaring |
| `payload` | jsonb not null | Strukturert handlingsdata – se 3.4 |
| `company_id` | uuid FK → companies on delete cascade | – |
| `task_id` | uuid FK → tasks on delete set null | – |
| `reversible` | boolean | Default true |
| `irreversible_warning` | text | Vises før godkjenning hvis ikke reversibel |
| `expires_at` | timestamptz | – |
| `decided_at` | timestamptz | – |
| `decided_by` | uuid FK → profiles | – |
| `rejection_reason` | text | – |
| `executed_at` | timestamptz | Tidspunkt da eksekvering ble avsluttet, **uavhengig av utfall**. Settes både ved `executed` og `execution_failed` (inkludert watchdog-timeout). Bruk `status` for å sjekke om utfallet var vellykket |
| `execution_error` | text | – |
| `slack_message_ts` | text | For å oppdatere Slack-melding etter beslutning |
| `created_at` | timestamptz | – |

**Indekser:** `status`, `agent_name`, `company_id`, `created_at`.

#### 3.3.9 `proposal_payload`-konvensjoner

`payload`-feltet er JSONB. For hver `action_type` har payload en bestemt form. Eksempler:

```jsonc
// action_type = 'phase_transition'
{
  "from_phase": "qualification",
  "to_phase": "sales",
  "trigger": "qualification_form_received"
}

// action_type = 'calendar_event'
{
  "title": "Kundemøte Rossi SRL",
  "start": "2026-04-14T08:00:00Z",
  "end": "2026-04-14T09:00:00Z",
  "attendees": ["magnus@nerra.com", "rossi@example.com"],
  "description": "..."
}

// action_type = 'email_draft'
// Merk: gmail_draft_id er IKKE satt av agenten – agenter har ikke Gmail-credentials
// (se 8.2). Hub oppretter draft i Gmail under eksekvering og lagrer ID-en på proposalen
// etter at handleren har lyktes. Når agenten foreslår, finnes payload uten dette feltet.
{
  "to": ["thomas@muller.de"],
  "cc": [],
  "subject": "Re: Spørsmål om sertifisering",
  "body_markdown": "...",
  "gmail_account": "magnus@nerra.com"
  // gmail_draft_id legges til av Hub etter at executeEmailDraft har opprettet drafty
}

// action_type = 'task_creation'
{
  "title": "Send Welcome Package til Schmidt",
  "category": "admin",
  "priority": "high",
  "due_date": "2026-04-12T17:00:00Z"
}
```

Payload-formene valideres med Zod-skjemaer i `packages/agents-sdk/src/proposal-schemas.ts`. Database lar JSONB være fritt – validering skjer på SDK-laget før insert.

#### 3.3.10 `activity_log`

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `actor_type` | text not null | `human` eller `agent` |
| `actor_id` | uuid | profiles.id eller NULL |
| `actor_name` | text | Agentnavn hvis agent |
| `action` | text not null | F.eks. `customer.phase_changed` |
| `entity_type` | text | `company`, `task`, `proposal`, ... |
| `entity_id` | uuid | – |
| `company_id` | uuid FK → companies on delete cascade | For raske kunde-spesifikke spørringer |
| `details` | jsonb | Strukturert payload (gammel/ny verdi osv.) |
| `created_at` | timestamptz | – |

**Indekser:** `created_at desc`, `company_id, created_at desc`, `actor_name`.

#### 3.3.11 `agent_runs`
Live-status for agentsiden.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `agent_name` | text not null | – |
| `status` | agent_run_status | – |
| `task_description` | text | Hva agenten jobber med |
| `company_id` | uuid FK → companies on delete set null | – |
| `started_at` | timestamptz | – |
| `last_heartbeat_at` | timestamptz | Agenten oppdaterer hvert 30. sek |
| `eta_seconds` | int | – |
| `progress_percent` | int | 0–100 |
| `cancel_requested` | boolean | Default false – agenten polller |
| `pause_requested` | boolean | – |
| `result` | jsonb | – |
| `error` | text | – |
| `completed_at` | timestamptz | – |

**Realtime:** Denne tabellen pushes via Supabase Realtime til Hub-frontenden.

#### 3.3.12 `agent_queue`
Køet arbeid per agent.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `agent_name` | text not null | – |
| `priority` | int | Lavere = høyere prioritet |
| `task_description` | text | – |
| `payload` | jsonb | – |
| `company_id` | uuid FK → companies on delete cascade | – |
| `scheduled_for` | timestamptz | – |
| `locked_at` | timestamptz | Settes når en worker plukker opp jobben |
| `locked_by` | text | Worker-ID som holder låsen |
| `lock_expires_at` | timestamptz | Etter dette kan jobben plukkes av en annen worker |
| `picked_up_at` | timestamptz | – |
| `agent_run_id` | uuid FK → agent_runs | Settes når agenten plukker opp |
| `attempts` | int | Default 0 – økes ved retry |
| `created_at` | timestamptz | – |

**Job-locking:** Workers henter jobber med `select ... for update skip locked` for å unngå at to workers plukker samme jobb. I tillegg har hver lås `lock_expires_at` (typisk +5 min fra `locked_at`) slik at en jobb kan reclaim'es hvis worker-en krasjet uten å frigi låsen. SQL-mønster:

```sql
update agent_queue
set locked_at = now(),
    locked_by = $worker_id,
    lock_expires_at = now() + interval '5 minutes',
    attempts = attempts + 1
where id = (
  select id from agent_queue
  where agent_name = $agent
    and (locked_at is null or lock_expires_at < now())
    and scheduled_for <= now()
  order by priority asc, created_at asc
  for update skip locked
  limit 1
)
returning *;
```

#### 3.3.13 `emails`
Metadata om innkommende e-post. Innholdet bor i Gmail.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `gmail_message_id` | text unique not null | – |
| `gmail_thread_id` | text | – |
| `account` | text not null | magnus@/martin@/contact@ |
| `from_address` | text | – |
| `from_name` | text | – |
| `to_addresses` | text[] | – |
| `subject` | text | – |
| `snippet` | text | Kort utdrag fra Gmail |
| `summary` | text | Agent-generert sammendrag |
| `category` | email_category | – |
| `company_id` | uuid FK → companies on delete set null | – |
| `received_at` | timestamptz | – |
| `gmail_url` | text | Direktelenke |
| `handled` | boolean | Default false |
| `created_at` | timestamptz | – |

#### 3.3.14 `meetings`
Møter fra Fireflies.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `fireflies_id` | text unique | – |
| `title` | text | – |
| `company_id` | uuid FK → companies on delete cascade | – |
| `started_at` | timestamptz | – |
| `duration_seconds` | int | – |
| `participants` | jsonb | – |
| `transcript_url` | text | Lenke til Fireflies eller Supabase Storage |
| `summary` | text | – |
| `action_items` | jsonb | Rådata fra Fireflies |
| `created_at` | timestamptz | – |

#### 3.3.15 `documents`
Generelt dokumentregister – research, kunderapporter, Welcome Package, kontrakter osv.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `company_id` | uuid FK → companies on delete cascade | – |
| `kind` | document_kind not null | `research`, `customer_report`, `welcome_package`, `contract`, `briefing`, `other` |
| `visibility` | document_visibility not null | `internal` eller `customer_shareable`. Default `internal` |
| `title` | text not null | – |
| `summary` | text | 1–3 setninger fra agent |
| `tags` | text[] | – |
| `language` | text | ISO 639-1 |
| `content_markdown` | text | For tekst-tunge dokumenter |
| `storage_path` | text | Supabase Storage-sti for binære filer (PDF) |
| `generated_by_agent` | text | – |
| `created_at` | timestamptz | – |
| `updated_at` | timestamptz | – |

**Visibility-regler:**
- `internal`: research, kunderapporter, briefinger – vises kun i Hub, aldri eksponert via kunde-lenke
- `customer_shareable`: Welcome Package, kontrakt-PDF – kan genereres som lenke til kunden
- Regelen håndheves i applikasjonskode: kunde-facing route handlers sjekker `visibility = 'customer_shareable'` før de leverer innhold
- `contracts` er en egen tabell med egen livssyklus – `documents.kind = 'contract'` brukes kun for historiske PDF-er knyttet til signerte kontrakter

#### 3.3.16 `contracts`
Tilbud/kontrakt – egen tabell fordi den har egen livssyklus.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `company_id` | uuid FK → companies on delete cascade | – |
| `status` | contract_status | – |
| `packages` | jsonb | `[{key: 'practical_training', persons: 3, price: 100000}]` |
| `subtotal` | numeric(12,2) | – |
| `adjustment_percent` | numeric(5,2) | Påslag eller fratrekk |
| `total` | numeric(12,2) | – |
| `currency` | text | – |
| `valid_until` | date | – |
| `public_url_slug` | text unique not null | Generert med `crypto.randomBytes(16).toString('base64url')` (128 bit entropi). Samme metode som qualification slugs. Aldri gjenbrukt selv om kontrakten kanselleres |
| `language` | text | Default `en` |
| `pdf_storage_path` | text | – |
| `sent_at` | timestamptz | – |
| `viewed_at` | timestamptz | – |
| `signed_at` | timestamptz | – |
| `signed_by_name` | text | – |
| `created_at` | timestamptz | – |

#### 3.3.16a `calendar_events`
Lokal kobling mellom Google Calendar-events og kunder. Brukes for å vise kommende møter på dashboardet uten å polle Google Calendar konstant, og for sporbarhet.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `company_id` | uuid FK → companies on delete set null | NULL hvis interne møter |
| `google_event_id` | text unique not null | Returnert fra Google Calendar API |
| `google_calendar_id` | text not null | Hvilken kalender (delt Nerra) |
| `title` | text not null | – |
| `description` | text | – |
| `start_at` | timestamptz not null | – |
| `end_at` | timestamptz not null | – |
| `location` | text | Fysisk eller Teams/Meet-lenke |
| `attendees` | jsonb | Array av e-post + status |
| `created_by_proposal_id` | uuid FK → proposals on delete set null | Hvis opprettet via et godkjent forslag |
| `created_by_agent` | text | – |
| `created_at` | timestamptz | – |
| `updated_at` | timestamptz | Oppdateres ved Google Calendar webhook eller poll |

**Indekser:** `company_id`, `start_at`, `google_event_id`.

**Sync-modell:** Vi har ikke webhook fra Google Calendar i MVP. I stedet polles delt kalender daglig (eller ved bruker-trigger) for å oppdatere `attendees` og status. Endringer agenten foreslår skjer alltid i begge retninger – Hub oppretter eventet i Google først (to-fase mønster, seksjon 6.5.4), og lagrer referansen i denne tabellen etterpå.

#### 3.3.17 `qualification_form_responses`
Svar fra det offentlige kvalifiseringsskjemaet.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `slug` | text unique | URL-token kunden får |
| `company_id` | uuid FK → companies on delete set null | Settes ved opprettelse, brukes ved innsending |
| `responses` | jsonb | Komplett svar |
| `submitted_at` | timestamptz | – |
| `submitter_email` | text | – |
| `created_at` | timestamptz | – |

#### 3.3.18 `system_alerts`
Røde bannere fra PRD seksjon 13.2.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `severity` | alert_severity not null | `info`, `warning`, `critical` |
| `source` | text not null | F.eks. `tripletex_api`, `supabase`, `agent_runtime` |
| `message` | text not null | – |
| `details` | jsonb | – |
| `acknowledged_at` | timestamptz | – |
| `acknowledged_by` | uuid FK → profiles | – |
| `created_at` | timestamptz | – |

#### 3.3.19 `agent_auth_nonces`
Lagring av challenge-nonces for agent-token-utstedelse. Se 5.2.2 for full beskrivelse.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `nonce` | uuid PK | – |
| `agent_name` | text not null | – |
| `created_at` | timestamptz not null | – |
| `expires_at` | timestamptz not null | `created_at + 60 sek` |
| `used_at` | timestamptz | NULL = ubrukt, satt = brukt |
| `request_ip` | inet | – |

#### 3.3.20 `agent_token_audit`
Audit-spor for token-utstedelse. RLS Mal C (kun service role).

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `agent_name` | text not null | – |
| `jti` | text not null | Token-ID |
| `issued_at` | timestamptz not null | – |
| `expires_at` | timestamptz not null | – |
| `request_ip` | inet | – |
| `kid` | text | Signing-nøkkel-ID brukt |

#### 3.3.21 `revoked_agent_tokens`
Kill-switch-tabell for nødrevokering av spesifikke tokens.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `jti` | text PK | Token-ID som er revokert |
| `agent_name` | text not null | – |
| `expires_at` | timestamptz not null | Når originaltokenet uansett ville utløpt |
| `revoked_at` | timestamptz not null | – |
| `revoked_by` | uuid FK → profiles | – |
| `reason` | text | – |

#### 3.3.22 `auth_rate_limit_buckets`
Sentralisert rate limiting for auth-endepunkter. Se 6.1.2.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `key` | text | F.eks. `challenge:agent_3_project` |
| `window_start` | timestamptz | Avrundet til minutt eller time |
| `count` | int not null | – |

**Primary key:** `(key, window_start)`.

#### 3.3.23 `contract_views`
Visningssporing per kontrakt. Brukes for sporbarhet ved tvister.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `contract_id` | uuid FK → contracts on delete cascade | – |
| `viewed_at` | timestamptz not null | – |
| `request_ip` | inet | – |
| `user_agent` | text | – |
| `kid` | text | HMAC-nøkkel-ID brukt for å validere lenken |

#### 3.3.24 `tripletex_sync_state`
Waterline-state for differensiell Tripletex-sync. Se 6.2.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `resource_type` | text PK | `invoices`, `payments`, `customers` |
| `last_synced_at` | timestamptz not null | – |
| `last_success_at` | timestamptz | – |
| `last_error` | text | – |
| `consecutive_failures` | int | Default 0 |

#### 3.3.25 `gdpr_deletions`
Logg over fullførte GDPR-slettinger. Inneholder ingen PII utover firmanavn.

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `id` | uuid PK | – |
| `company_name` | text not null | Bevart for å vise i revisjon, ikke kobles tilbake til person |
| `deleted_at` | timestamptz not null | – |
| `reason` | text | `retention_5_year`, `customer_request`, `manual` |
| `triggered_by` | uuid FK → profiles | NULL hvis automatisk |



### 3.4 Triggere

- `set_updated_at`-trigger på alle tabeller med `updated_at`
- `seed_phase_checklist_items` etter insert på `companies` – seeder hardkodede items per fase
- `enforce_single_primary_contact` constraint trigger på `contacts`
- `log_to_activity` triggere på `companies` (ved phase-endring), `tasks` (ved status-endring), `proposals` (ved beslutning)
- **`set_closed_at_on_finished`** trigger på `companies`: når `phase` endres til `'finished'` og `closed_at is null`, setter den `closed_at = now()`
- **`prevent_closed_at_modification`** trigger på `companies`: blokkerer enhver `update` av `closed_at` når den allerede har en verdi (raises exception). Dette håndhever immutabilitet på databasenivå – appen kan ikke ved feil eller bevisst nullstille retention-klokken
- **`block_closed_phase_change`** trigger på `companies`: når `phase = 'finished'` og noen prøver å endre den til noe annet, krever dette en eksplisitt service role-flagg (egen funksjon `force_reopen_finished_company(company_id)`). Forhindrer at en agent ved feil drar en ferdig kunde ut av arkivet

---

## 4. Row Level Security

**Grunnprinsipp:** Alle tabeller har RLS aktivert. To roller:

1. **`authenticated`** – Magnus og Martin via Supabase Auth (Google OAuth, e-post må slutte på `@nerra.com`). Full lese- og skrivetilgang til alt med mindre annet er spesifisert.
2. **`service_role`** – brukes **kun fra Hub sin server-side kode**. Aldri eksponert til klient. Aldri brukt i React-komponenter. **Aldri brukt av Modal-agenter.**

### 4.1 Service role-grenser (kritisk)

Service role er en hovednøkkel som bypasser all RLS. Lekker den, lekker hele databasen. Derfor:

**Service role-nøkkelen finnes kun ett sted:** Vercel server-side env vars for Hub-prosjektet. Modal har *ikke* tilgang til den. Modal-agenter snakker aldri direkte med Supabase – de går via Agent-API-et på `apps/hub/app/api/agent/*`, og Hub gjør database-operasjonene på deres vegne.

**Hvorfor denne arkitekturen:**
- En kompromittert agent kan kun gjøre det Agent-API-et tillater (begrenset av scopes)
- En lekket service role gir full eksfiltrasjon – så vi minimerer hvor mange systemer som har den
- Agent-API-et fungerer som et tynt sikkerhetslag mellom agenter og rå database
- Audit-loggen i `agent_token_audit` og `activity_log` viser nøyaktig hvilke agenter som har gjort hva

**Service role-klienten lever kun i `apps/hub/lib/supabase/service.ts`** og importeres kun fra:
- `apps/hub/app/api/agent/**` (agent-API-ruter)
- `apps/hub/app/api/webhooks/**` (webhook-mottakere)
- `apps/hub/app/api/cron/**` (planlagte jobber)
- `apps/hub/app/api/agent-auth/**` (token-utstedelse)

**ESLint-regel** sperrer import av `service.ts` fra alle andre filer (`no-restricted-imports`).

**Frontenden bruker alltid bruker-sesjonen** via `apps/hub/lib/supabase/server.ts` (server components) eller `client.ts` (klient-komponenter). Disse respekterer RLS.

**Service role-nøkkelen finnes kun i Vercel server-side env vars** (ikke `NEXT_PUBLIC_*`). Hver bruk fra service role logges med agent_name eller webhook-source for sporbarhet.

### 4.2 RLS policy-maler

**Mal A – Standardtabeller (kunder, oppgaver, dokumenter osv.):**

```sql
alter table <table> enable row level security;

create policy "nerra_users_full_access" on <table>
  for all
  to authenticated
  using (
    auth.jwt() ->> 'email' like '%@nerra.com'
  )
  with check (
    auth.jwt() ->> 'email' like '%@nerra.com'
  );
```

**Mal B – Systemtabeller (kun service role skriver, mennesker kan lese):**

For tabeller som `system_alerts`, `agent_queue`, `agent_runs`, `contract_views`, `gdpr_deletions`:

```sql
alter table <table> enable row level security;

-- Mennesker kan lese for å monitorere
create policy "nerra_users_read_only" on <table>
  for select
  to authenticated
  using (
    auth.jwt() ->> 'email' like '%@nerra.com'
  );

-- Ingen insert/update/delete-policy for authenticated
-- Service role bypasser RLS og er eneste skriver
```

**Unntak:** `system_alerts` har én ekstra policy som lar `authenticated` sette `acknowledged_at` og `acknowledged_by` (men ikke endre andre felter). Dette gjør at Magnus/Martin kan kvittere varsler fra Hub-UI.

**Mal C – Sensitive sikkerhetstabeller (kun service role, fullstendig lukket):**

For tabeller som `agent_token_audit`, `revoked_agent_tokens`, `agent_auth_nonces`, `auth_rate_limit_buckets`:

```sql
alter table <table> enable row level security;
-- Ingen policies for authenticated
-- Kun service role har tilgang
```

Disse tabellene inneholder IP-er, token-mønstre og andre data som kan gi en angriper innsikt i sikkerhetssystemet vårt. De skal aldri være synlige fra klient-sesjonen – Hub-UI viser dem via aggregerte views eller dedikerte API-endepunkter med eksplisitt service role-tilgang.

Hvis vi senere trenger at Magnus/Martin kan se audit-data fra UI-et, lager vi en dedikert view som ekskluderer sensitive felter (IP-er, rå token-ID-er) og gir `select`-tilgang på *viewet*, ikke tabellen.

### 4.3 Offentlige tabeller

`qualification_form_responses` har én ekstra policy som tillater anon insert basert på en signert HMAC-token, ikke bare slug. Se seksjon 5.3.

**Kontrakt-visning:** Kunden trenger å lese sin egen kontrakt via signert URL. Dette eksponeres via en Next.js Route Handler som verifiserer HMAC-signaturen, bruker service role internt, og returnerer kun den ene raden – aldri direkte Supabase-kall fra klient.

### 4.4 Realtime-restriksjoner

Supabase Realtime aktiveres kun på tabeller som ikke inneholder rå PII:

| Tabell | Realtime |
|---|---|
| `proposals` | Ja |
| `agent_runs` | Ja |
| `system_alerts` | Ja |
| `tasks` | Ja |
| `companies` | Ja (kun navn/fase/flag eksponeres via view) |
| `activity_log` | **Nei** – `details`-feltet kan inneholde PII (gammel/ny verdi) |
| `emails` | **Nei** – inneholder e-post-metadata |
| `meetings` | **Nei** – inneholder transkripsjon-referanser |
| `documents` | **Nei** – inneholder kunderapporter |
| `contracts` | **Nei** – inneholder pris/vilkår |
| `calendar_events` | **Nei** – polles daglig fra Google Calendar, Realtime gir liten verdi |

For tabeller uten Realtime poller frontenden ved behov eller refresh-trigger fra brukerhandling.

---

## 5. Autentisering

### 5.1 Hub-autentisering

- Supabase Auth med Google OAuth
- Tillatte e-poster: hardkodet whitelist `['magnus@nerra.com', 'martin@nerra.com']` i `apps/hub/middleware.ts`
- Innloggingsside: `/login`, ellers redirectes alle ruter til `/login` hvis ikke autentisert
- 2FA håndteres på Google-kontonivå (Workspace-policy)
- Sesjon i HTTP-only cookies, ingen tokens i localStorage

### 5.2 Agent-API-autentisering

Agent-API-et bruker **kortlivede JWT-er som rotereres**, hentet via et token-endepunkt som krever **dobbel verifisering**: nonce-signering med seed-nøkkel + IP-hvitliste.

#### 5.2.1 Token-format (JWT, HS256)

```jsonc
{
  "iss": "nerra-hub",
  "sub": "agent_3_project",        // agent_name
  "kid": "agent-2026-04-001",      // signing key ID for rotasjon
  "iat": 1712534400,
  "nbf": 1712534340,                // not-before, 60 sek clock skew
  "exp": 1712538000,                // 1 time levetid
  "jti": "uuid-v7-...",             // unik token-ID for revokering
  "scopes": ["proposals:write", "tasks:write", "companies:read"]
}
```

Validatoren godtar `nbf` og `exp` med 60 sekunders klokkeskjevhetstoleranse.

#### 5.2.2 Token-utstedelse

Hver agent har en langlivet **seed-nøkkel** (32+ byte, lagret i Modal Secrets). Seed-en byttes mot et kortlivet JWT via en **utfordring/respons-flyt**, ikke ved å sende seed-en direkte:

1. Agenten kaller `GET /api/agent-auth/challenge?agent=agent_3_project`
2. Hub validerer `agent_name` mot `ALLOWED_AGENT_NAMES`. Hvis IP-hvitliste er aktiv (Modus A, se 5.2.3), valideres også at request-IP er på listen.
3. Server genererer en fersk `nonce` (UUID v7) og lagrer den i `agent_auth_nonces`-tabellen med 60 sek TTL. Server returnerer nonce med `Cache-Control: no-store`.
4. Agenten beregner `signature = HMAC-SHA256(seed_key, nonce + agent_name + iat)` og kaller `POST /api/agent-auth/token` med `{ agent, nonce, iat, signature }`
5. Server slår opp nonce i `agent_auth_nonces`. Hvis nonce finnes, ikke er utløpt, og `used_at is null`: marker den som brukt (`update ... set used_at = now() where ... and used_at is null returning *`). Den atomiske oppdateringen sikrer one-time-use selv ved samtidige requests.
6. Server henter seed-nøkkelen for agenten, beregner forventet signatur, sammenligner i konstant tid
7. Hvis match (og IP fortsatt på hvitliste i Modus A): server utsteder JWT, logger utstedelsen i `agent_token_audit`. Responsen settes med `Cache-Control: no-store` slik at ingen mellomliggende cache (CDN, proxy) lagrer tokenet

**Hvorfor Postgres-tabell, ikke in-memory cache:**

Vercel kjører flere lambda-instanser samtidig. En `challenge`-request kan treffe instans A, mens den påfølgende `token`-requesten treffer instans B. In-memory cache i instans A er usynlig for instans B. Postgres-tabell er delt på tvers av alle instanser.

**Hvorfor ikke Redis/Upstash:**

Volumet er lavt (10–20 nonces per time totalt). Postgres er sterkt nok, holder stack-en enkel, og gjenbruker samme database vi bruker for alt annet.

**Hvorfor dette er bedre enn å sende seed direkte:**
- Seed-en forlater aldri Modal-prosessen
- Selv om noen sniffer requesten, kan de ikke gjenbruke nonce-en (one-time-use, atomisk oppdatering)
- Konstant-tid-sammenligning forhindrer timing-angrep
- I Modus A: IP-hvitlisten gjør at en lekket seed alene er ubrukelig fra en annen lokasjon

**`agent_auth_nonces`-tabell:**

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `nonce` | uuid PK | – |
| `agent_name` | text not null | – |
| `created_at` | timestamptz not null | – |
| `expires_at` | timestamptz not null | `created_at + 60 sek` |
| `used_at` | timestamptz | NULL = ubrukt, satt = brukt |
| `request_ip` | inet | – |

**RLS:** Kun service role har tilgang. Cron-job sletter rader hvor `expires_at < now() - interval '1 hour'`.

#### 5.2.3 IP-hvitliste (betinget – krever Modal Proxies)

IP-hvitliste er et **valgfritt ekstra sikkerhetslag** oppå nonce-signering, ikke en hard avhengighet. Det er kun aktivt hvis Modal Proxies er konfigurert.

**Bakgrunn:** Modal kjører som standard på delt infrastruktur uten faste egress-IP-er. For å få stabile IP-er må vi bruke [Modal Proxies (beta)](https://modal.com/docs/guide/proxy-ips) – en feature som krever Team Plan eller høyere og legger til en WireGuard-tunnel med inntil 5 statiske IP-er per proxy.

**To moduser:**

**Modus A – Modal Proxies aktivert (anbefalt for produksjon):**
- En proxy konfigureres i Modal med 2–5 statiske IP-er
- Alle agenter konfigureres til å bruke proxien (`proxy=Proxy.from_name("nerra-egress")`)
- Hub validerer at request-IP er på `AGENT_IP_ALLOWLIST` ved både `/api/agent-auth/challenge` og `/api/agent-auth/token`
- Egen overgangsperiode hvis Modal endrer IP-ene: nye IP-er legges til hvitlisten før gamle fjernes (24 timers grace)

**Modus B – Ingen Modal Proxies (MVP-default):**
- IP-hvitliste-validering er **avskrudd** (`AGENT_IP_ALLOWLIST_ENABLED=false`)
- Sikkerheten hviler på nonce-signering + kortlivede tokens + audit-logg
- Dette er fortsatt sterkt: en angriper må stjele seed-nøkkelen *og* være i stand til å nå Hub-API-et innen seed-en oppdages
- Hub-API-et er offentlig tilgjengelig på Vercel uansett (det er hvordan agenter når det), så IP-binding gir ekstra forsvar i dybden, ikke en hovedforsvarslinje

**Beslutning og oppgradering:**
- MVP starter i Modus B for å unngå å låse oss til Modal Team Plan før det er nødvendig
- Når første ekte kunde tas inn (Fase 4), evaluerer vi om vi skal flytte til Team Plan og aktivere Modus A
- Migreringen er triviell: legg til Modal Proxies i agent-koden, sett `AGENT_IP_ALLOWLIST` i Vercel, sett `AGENT_IP_ALLOWLIST_ENABLED=true`. Ingen kodeendringer i Hub.

**Hva som *aldri* hviler på IP-binding:**
- Token-validering (alltid via JWT-signatur og `revoked_agent_tokens`)
- Scope-håndhevelse
- Rate limiting (basert på `sub`-claim, ikke IP)

Disse fungerer identisk i begge moduser.

#### 5.2.4 Token-grenser per agent

- **Maks 3 samtidige aktive tokens** per `agent_name`. Når et 4. utstedes, invalideres den eldste (legges til `revoked_agent_tokens`)
- **Token-utstedelse rate-limit:** 10 token-utstedelser per agent per time, 60 per IP per time
- **Brukstid:** 1 time fra `iat`
- **Refresh:** Agent-SDK refresher automatisk når tokenet har 5 min igjen

#### 5.2.5 Signing-nøkkel-rotasjon

- `AGENT_JWT_SIGNING_KEYS` i Vercel env vars: JSON med flere nøkler indeksert med `kid`
- Ny nøkkel legges til, eksisterende blir værende i 24 timer for grace period, deretter fjernes
- Server validerer alle aktive `kid`-er, signerer nye tokens med nyeste `AGENT_JWT_ACTIVE_KID`
- Rotasjonsfrekvens: månedlig (se drift-runbook)

#### 5.2.6 Kill-switch

- `revoked_agent_tokens (jti, agent_name, expires_at, revoked_at, reason)` for nødrevokering
- Server sjekker denne tabellen ved hver request (cached 60 sek i memory per Vercel-instans)
- Egen `/api/admin/revoke-agent-token`-endepunkt (kun fra Hub UI, krever menneskelig auth)
- Kompromittert seed-nøkkel byttes umiddelbart i Modal og alle agentens aktive tokens revokeres

**Effektiv revokerings-tid:** Inntil 60 sekunder. Når en token revokeres, vil Vercel-instanser som har cachet den gamle revokeringslisten fortsatt akseptere tokenet i opptil 60 sek til cachen utløper. Dette er en bevisst tradeoff:
- Uten cache måtte hver request slå opp i database – det legger til latency og last
- 60 sek er akseptabelt for alle realistiske scenarioer (en angriper får maks 1 minutt med en revokert token, og må fortsatt være innenfor IP-hvitlisten i Modus A)
- For umiddelbar revokering: bytt seed-nøkkelen i Modal Secrets – da kan ingen nye tokens utstedes overhodet

Hvis 60 sek noensinne blir et problem, kan vi senke cache-tiden eller bruke en delt cache (Redis) for instant invalidering. Ikke MVP.

#### 5.2.7 Audit-logg for token-utstedelse

Tabellen `agent_token_audit` logger hver token-utstedelse:

| Kolonne | Beskrivelse |
|---|---|
| `id` | UUID v7 |
| `agent_name` | – |
| `jti` | Token-ID |
| `issued_at` | – |
| `expires_at` | – |
| `request_ip` | IP som ba om tokenet |
| `kid` | Signing-nøkkel-ID brukt |

Brukes for sporbarhet og deteksjon av uvanlige mønstre (mange utstedelser fra ny IP osv.).

### 5.3 Kvalifiseringsskjema-autentisering

Slugs alene er ikke nok – de kan gjettes eller brute-forces. Vi bruker **versjonerte HMAC-tokens** i URL-en.

#### 5.3.1 URL-format

```
https://qualification.nerra.com/q/<slug>?t=<kid>.<expires_at>.<base64url-signature>
```

Token-en består av tre deler separert med punktum:
- `kid` – HMAC-nøkkel-ID for sømløs rotasjon
- `expires_at` – Unix timestamp, 30 dager fra utstedelse
- `signature` – HMAC-SHA256 av `slug + expires_at` med nøkkelen identifisert av `kid`, base64url-kodet

Server verifiserer signaturen mot riktig nøkkel (slått opp via `kid`), sjekker at `expires_at > now()`.

#### 5.3.2 HMAC-nøkkelhåndtering

- `QUALIFICATION_URL_HMAC_KEYS` i Vercel env vars: JSON med nøkler indeksert med `kid`
- Hver nøkkel er minimum **32 byte (256 bit)** entropi
- `QUALIFICATION_URL_HMAC_ACTIVE_KID` peker på nyeste
- Rotasjonsfrekvens: kvartalsvis (se drift-runbook)
- Gamle nøkler beholdes i 30 dager etter rotasjon for å validere eksisterende lenker

#### 5.3.3 Andre tiltak

- **HTTPS only.** HSTS-header satt med `max-age=31536000; includeSubDomains; preload`
- **Slug-entropi:** generert med `crypto.randomBytes(16)` (128 bit) – ikke gjettbar
- **Edge rate-limiting:** 10 forespørsler per IP per minutt på `/q/*`
- **Innsendings-rate-limiting:** 1 innsending per slug per time
- **Bot-blokkering:** Block-list mot kjente bot-user-agents på edge
- **IP og User-Agent logges** ved hver innsending for misbruksdeteksjon
- **410 Gone:** Hvis `qualification_form_responses.submitted_at is not null` (allerede innsendt) eller `expires_at < now()`, returneres 410 i stedet for 404 – eksplisitt "denne lenken er stengt"
- **CAPTCHA:** Legges til kun hvis vi observerer misbruk (ikke MVP)

### 5.4 Kontraktvisning-autentisering

Samme mønster som kvalifiseringsskjema:

#### 5.4.1 URL-format

```
https://hub.nerra.com/contract/<slug>?t=<kid>.<expires_at>.<base64url-signature>
```

#### 5.4.2 HMAC-nøkkelhåndtering

- `CONTRACT_URL_HMAC_KEYS` i Vercel env vars
- 32+ byte per nøkkel
- Kvartalsvis rotasjon
- Gamle nøkler beholdes i 90 dager etter rotasjon (lengre enn qualification fordi kontrakter har lengre levetid)

#### 5.4.3 Andre tiltak

- **HTTPS only**, samme HSTS-header
- **Slug-entropi:** 128 bit
- **Edge rate-limiting:** 20 forespørsler per IP per minutt
- **Hver visning logges** i `contract_views`-tabellen med IP, UA, timestamp
- **`contracts.viewed_at`** oppdateres ved første visning (for sporbarhet)
- **410 Gone:** Returneres når kontrakt er signert (`signed_at is not null`), avvist (`status = 'declined'`), eller utløpt (`valid_until < today`). Dette lukker overflaten – signerte kontrakter kan ikke lenger ses via den opprinnelige lenken
- **Bot-blokkering:** Block-list mot kjente bot-user-agents

**Åpen beslutning – ettertilgang til signert kontrakt:** 410 Gone etter signering er sikkerhetsmessig riktig, men det betyr at kunden ikke kan åpne sin egen signerte kontrakt i etterkant via den opprinnelige lenken. Det finnes to mulige løsninger som må avklares som forretningsbeslutning, ikke teknisk:

1. **Ingen ettertilgang via lenke** – kunden må kontakte Nerra for å få kontrakten på nytt (via e-post-vedlegg). Enklest, mest lukket.
2. **Ny lenke på forespørsel** – et `/contract/<slug>/request-access`-endepunkt lar kunden be om en ny signert URL som sendes til den registrerte e-postadressen til kontaktpersonen. Gir kunden kontroll uten å svekke sikkerheten.

Valg fattes før Fase 4 (kontraktgenerering bygges).

---

## 6. API-design

Hub har tre lag av API-er:

1. **Server actions / RSC** – brukes av Hub-frontenden internt. Ikke dokumentert som offentlig API.
2. **Agent-API** – under `/api/agent/*`. Brukes av Modal-agenter.
3. **Webhook-mottakere** – under `/api/webhooks/*`. Brukes av Slack, Gmail, Fireflies, Tripletex, signeringstjeneste.

### 6.1 Agent-API-katalog

Alle endepunkter krever Bearer-token. Alle bruker JSON inn og JSON ut. Alle valideres med Zod.

| Metode | Sti | Formål | Scope |
|---|---|---|---|
| `POST` | `/api/agent/proposals` | Opprett et forslag i godkjenningskøen | `proposals:write` |
| `GET` | `/api/agent/proposals/:id` | Hent status på et forslag | `proposals:read` |
| `POST` | `/api/agent/companies` | Opprett kunde (typisk fra Slack-flyten) | `companies:write` |
| `PATCH` | `/api/agent/companies/:id` | Oppdater kundefelt | `companies:write` |
| `GET` | `/api/agent/companies/:id/context` | Hent full kundekontekst for agent-prompt | `companies:read` |
| `POST` | `/api/agent/tasks` | Opprett oppgave | `tasks:write` |
| `PATCH` | `/api/agent/tasks/:id` | Oppdater oppgave | `tasks:write` |
| `POST` | `/api/agent/activity` | Logg en aktivitet | `activity:write` |
| `POST` | `/api/agent/runs` | Registrer at en agent har startet | `runs:write` |
| `PATCH` | `/api/agent/runs/:id` | Heartbeat / progress / completion | `runs:write` |
| `GET` | `/api/agent/runs/:id/control` | Polles av agenten – returnerer cancel/pause | `runs:read` |
| `POST` | `/api/agent/documents` | Last opp et generert dokument | `documents:write` |
| `POST` | `/api/agent/emails` | Registrer en e-post (etter kategorisering) | `emails:write` |
| `POST` | `/api/agent/meetings` | Registrer et møte fra Fireflies | `meetings:write` |
| `POST` | `/api/agent/alerts` | Opprett systemvarsel | `alerts:write` |
| `POST` | `/api/agent/search` | Søkeagentens spørringer mot kundedata | `search:read` |

**Kritisk regel:** Agent-API-et eksponerer aldri rå Supabase-skjemaet. Hver endpoint er en eksplisitt kontrakt. Hvis vi senere endrer datamodellen kan vi holde API-formen stabil.

**Scope-håndhevelse:** Hver endepunkt sjekker at JWT-en inneholder riktig scope i `scopes`-claim. Request uten nødvendig scope returnerer 403. Sjekken skjer i en felles middleware som kjører før endepunkt-handleren.

### 6.1.1 RBAC-matrise per agent

| Agent | Scopes |
|---|---|
| `ceo` | Alle scopes (orkestrering) |
| `agent_1_meeting` | `meetings:write`, `proposals:write`, `tasks:write`, `activity:write`, `runs:write`, `companies:read` |
| `agent_2_followup` | `proposals:write`, `tasks:write`, `activity:write`, `runs:write`, `companies:read`, `emails:write` |
| `agent_3_project` | `proposals:write`, `companies:write`, `tasks:write`, `activity:write`, `runs:write`, `companies:read` |
| `agent_4_receipts` | `proposals:write`, `activity:write`, `runs:write` |
| `agent_5_briefing` | `documents:write`, `activity:write`, `runs:write`, `companies:read` |
| `agent_6_lead_research` | `companies:write`, `documents:write`, `proposals:write`, `activity:write`, `runs:write` |
| `agent_8_travel` | `proposals:write`, `tasks:write`, `activity:write`, `runs:write`, `companies:read` |
| `agent_9_mentor` | `activity:write`, `runs:write`, `companies:read` |
| `research_agent` | `documents:write`, `companies:read`, `activity:write`, `runs:write` |
| `bug_agent` | `proposals:write`, `alerts:write`, `activity:write`, `runs:write` |
| `search_agent` | `search:read`, `runs:write` |
| `dev_agent` | (ingen Hub-API scopes – jobber mot GitHub, ikke Hub) |

**Prinsipp:** Minste nødvendige rettighet. Hvis en agent ikke trenger å lese kundedata, skal den ikke kunne det. Hvis den ikke trenger å skrive, skal den ikke kunne det.

### 6.1.2 Rate limiting på agent-API

Rate limiting har to lag avhengig av sensitivitet:

**Lag 1 – Auth-endepunkter (sentralisert):**

`/api/agent-auth/challenge` og `/api/agent-auth/token` bruker **Postgres-basert rate limiting** via tabellen `auth_rate_limit_buckets (key, count, window_start)`. Dette sikrer at brute-force-forsøk ikke kan spres over Vercel-instanser uten å bli oppdaget. Mønster:

```sql
insert into auth_rate_limit_buckets (key, count, window_start)
values ($key, 1, date_trunc('minute', now()))
on conflict (key, window_start)
do update set count = auth_rate_limit_buckets.count + 1
returning count;
```

Hvis returnert `count` overstiger limit, returnerer endepunktet 429.

Grenser:
- **10 utstedelser per agent per time** (challenge + token-par)
- **60 utstedelser per IP per time**
- **5 utstedelser per IP per minutt** (mot raske brute-force-forsøk)

**Lag 2 – Vanlig agent-API (best-effort):**

Andre `/api/agent/*`-endepunkter bruker **in-memory rate limiting** per Vercel-instans. Dette er bevisst en mykere grense:

- Volumet er høyere (heartbeats, status-oppdateringer)
- Forespørslene er allerede authentiserte med JWT – vi er ikke i auth-fasen
- Eksakt presisjon er ikke kritisk
- Senere kan vi legge til Redis-backed counter hvis vi ser misbruk

Grenser per agent (basert på JWT `sub`-claim):
- **100 requests per minutt** – mykt tak
- **1000 requests per time** – daglig hint

Per IP:
- **200 requests per minutt** – per kildes-IP

**Ved overskridelse (begge lag):**
- Returnerer 429 med `Retry-After`-header (sekunder til neste mulig forsøk)
- Agent-SDK-et respekterer `Retry-After` og backoffer automatisk
- Kontinuerlig overskridelse fra samme agent over flere minutter trigger alarm i `#nerra-alerts`

**Hva som ikke er rate-limited:**
- Agent heartbeat-endepunktet (`PATCH /api/agent/runs/:id`) har høyere grense for å støtte 30-sekunders heartbeat-intervall

**`auth_rate_limit_buckets`-tabell:**

| Kolonne | Type | Beskrivelse |
|---|---|---|
| `key` | text | F.eks. `challenge:agent_3_project` eller `ip:1.2.3.4` |
| `window_start` | timestamptz | Avrundet til minutt eller time |
| `count` | int | – |

**Primary key:** `(key, window_start)`. Cron-job sletter rader hvor `window_start < now() - interval '2 hours'`.

### 6.2 Webhook-mottakere

| Sti | Avsender | Verifisering |
|---|---|---|
| `/api/webhooks/slack` | Slack Events API | Slack signing secret |
| `/api/webhooks/slack/interactions` | Slack interactive messages | Slack signing secret |
| `/api/webhooks/gmail` | Gmail Pub/Sub | Pub/Sub JWT verification |
| `/api/webhooks/fireflies` | Fireflies | HMAC-signatur |
| `/api/webhooks/contract-signed` | Signeringstjeneste | Provider-spesifikk |

Alle webhook-mottakere returnerer 200 raskt og legger det faktiske arbeidet på `agent_queue` for asynkron prosessering. Dette holder webhook-respons under tidsgrenser fra leverandørene. Hver webhook bruker en `idempotency_key` (typisk en hash av payload + timestamp eller en provider-spesifikk ID) for å unngå dobbeltprosessering ved retries.

**Tripletex bruker poll, ikke webhook.** Tripletex sin API tilbyr ikke webhook-signaturer, og IP-allowlist alene er for skjørt. I stedet kjøres en cron-job hvert 15. minutt som synkroniserer relevante data:

| Sti | Frekvens | Formål |
|---|---|---|
| `/api/cron/tripletex-sync` | Hvert 15. min | Hent fakturaer, betalinger, kundebalanse for alle aktive kunder |

Cron-jobben kjøres via Vercel Cron, autentiseres med `CRON_SECRET` i header, og bruker service role internt.

**Idempotens og differensiell sync:**

- Tabellen `tripletex_sync_state` holder `last_synced_at` per ressurstype (`invoices`, `payments`, `customers`)
- Sync henter kun ressurser med `lastModified > last_synced_at` (differensiell)
- Hver ressurs har en idempotensnøkkel basert på Tripletex sin interne `id` + `version` – upsert på denne nøkkelen
- Hvis samme faktura dukker opp to ganger, blir det en no-op i andre runde
- `last_synced_at` oppdateres kun når hele batchen er ferdig uten feil

**Backoff og feilhåndtering:**

- Ved 429 (rate limit): respekter `Retry-After`-header, fall tilbake til eksponensiell backoff (1s, 2s, 4s, 8s, 16s) hvis mangler
- Ved 5xx: maks 3 forsøk med eksponensiell backoff, deretter logg feilen og avbryt denne runden (neste cron-kjøring prøver igjen)
- 3 sammenhengende feilede runder → alarm i `#nerra-alerts`
- Partiell sync er tillatt: hvis fakturaer sync'es OK men betalinger feiler, oppdateres `last_synced_at` bare for fakturaer

### 6.3 Realtime-kanaler

Frontenden abonnerer på Supabase Realtime-kanaler for live-oppdatering. **Kun tabeller uten rå PII har Realtime aktivert** – se 4.4 for begrunnelse.

| Kanal | Tabell | Filter |
|---|---|---|
| `proposals_active` | `proposals` | `status in ('pending_approval','approved_pending_execution','execution_failed')` |
| `agent_runs_active` | `agent_runs` | `status in ('queued','running','paused')` |
| `system_alerts_unack` | `system_alerts` | `acknowledged_at is null` |
| `tasks_active` | `tasks` | `status in ('open','in_progress')` |

**Hvorfor `proposals_active` streamer flere statuser:**
- `pending_approval` – nye forslag dukker opp i godkjenningskøen
- `approved_pending_execution` – UI viser "Behandler..." mens eksekvering pågår
- `execution_failed` – UI viser rødt kort med recovery-handlinger (se 6.5.8)

Dette gir Magnus live-oppdatering gjennom hele proposal-livssyklusen uten å måtte refreshe manuelt.

For Innboks, Møter, Dokumenter, Kontrakter, Aktivitetslogg og Calendar Events brukes manuell refresh eller polling – aldri Realtime.

### 6.4 Helsesjekk

`GET /api/health` er offentlig (ingen auth) og returnerer:

```jsonc
{
  "status": "ok",                       // eller "degraded" / "down"
  "version": "1.0.0",                    // hentet fra package.json
  "commit": "abc123",                    // git SHA
  "min_supported_sdk_version": "1.4.0",  // se 11.6 – agenter med eldre SDK bør oppgradere
  "checks": {
    "database": "ok",                    // Supabase reachable
    "storage": "ok"                      // Supabase Storage reachable
  },
  "timestamp": "2026-04-07T14:23:01.234Z"
}
```

Bruk:
- Modal-agenter sjekker `/api/health` før de starter et langt arbeid – avbryter pent hvis Hub er nede
- Ekstern uptime-monitorering (UptimeRobot, Better Stack) poller dette hvert minutt
- Returnerer 200 hvis status `ok`, 503 ellers
- Endepunktet er rate-limited (60 req/min per IP) for å unngå misbruk

Ingen sensitive data eksponeres – ingen kundetall, ingen agentnavn, ingen detaljer om interne feil.

### 6.5 Proposal-eksekvering

Når Magnus eller Martin trykker "Godkjenn" på et forslag i godkjenningskøen, skjer eksekveringen i Hub server-side – ikke hos agenten. Agenten var bare opphavet til forslaget, og varsles ikke direkte. Den vil senere kunne lese resultatet via `activity_log` eller `GET /api/agent/proposals/:id`.

#### 6.5.1 Eksekveringsflyt

1. **Server action `executeProposal(proposalId)`** kalles fra Hub-UI når Magnus trykker Godkjenn
2. Action verifiserer at brukeren er authenticated og autorisert (whitelist-sjekk)
3. Action låser proposalen med `select ... for update` for å hindre samtidig eksekvering
4. Action sjekker at proposal-status er `pending_approval` – ellers returnerer `already_decided`
5. Action setter status til `approved_pending_execution`, registrerer `decided_by` og `decided_at`
6. Action slår opp `payload.action_type` og dispatcher til riktig handler i `apps/hub/lib/proposals/executors/`
7. Handler kjøres med `payload` og en database-transaksjon (eller to-fase mønster ved ekstern API)
8. Hvis suksess: handler returnerer `{ ok: true, side_effects: [...] }`. Action markerer proposal som `executed` med `executed_at = now()`
9. Hvis feil: handler returnerer `{ ok: false, error }`. Action markerer proposal som `execution_failed` med `execution_error` satt – **ikke** `rejected`, fordi mennesket faktisk godkjente

**Status-semantikk – kritisk skille:**

| Status | Betydning |
|---|---|
| `pending_approval` | Forslag venter på menneskelig beslutning |
| `rejected` | **Mennesket sa nei.** Eksekvering har aldri startet |
| `approved_pending_execution` | Mennesket sa ja, eksekvering er midlertidig (vises som "Behandler..." i UI) |
| `executed` | Mennesket sa ja, og handlingen ble vellykket utført |
| `execution_failed` | Mennesket sa ja, men handlingen feilet teknisk. Krever oppmerksomhet – vises som rødt kort i UI |
| `expired` | Forslag fikk aldri en beslutning før utløp |

Dette skillet er essensielt: hvis Magnus åpner audit-loggen og ser et `rejected`-forslag, vet han at *han* sa nei. Hvis han ser `execution_failed`, vet han at *han* sa ja men noe gikk galt – og kan undersøke hva som faktisk skjedde.

#### 6.5.2 Eksekveringshandlere per `action_type`

Hver handler bor i en egen fil med standard signatur (eksempel-implementering vises i 6.5.3):

```ts
// apps/hub/lib/proposals/executors/phase-transition.ts
import { db } from '@/lib/db/transactional';
import type { ExecutionContext, ExecutionResult } from '../types';

export async function executePhaseTransition(
  payload: PhaseTransitionPayload,
  ctx: ExecutionContext
): Promise<ExecutionResult> {
  // Faktisk implementering vises i 6.5.3
}
```

`ExecutionContext` inneholder:
- `proposal_id` – id på proposalen som kjøres
- `proposal` – full proposal-rad inkludert `agent_name`
- `user_id` – Magnus eller Martin (brukeren som godkjente)
- `request_id` – korrelasjons-ID for logging

Handleren bruker `db` importert fra `lib/db/transactional.ts` (den direkte `postgres`-instansen, ikke Supabase-klienten). Eksempler vises i 6.5.3.

**Handler-katalog (med fase-tilhørighet):**

| `action_type` | Handler | Modus | Bygges i fase |
|---|---|---|---|
| `phase_transition` | `executePhaseTransition` | Transaksjonell | Fase 2 |
| `task_creation` | `executeTaskCreation` | Transaksjonell | Fase 2 |
| `customer_update` | `executeCustomerUpdate` | Transaksjonell | Fase 2 |
| `calendar_event` | `executeCalendarEvent` | To-fase (Google Calendar API) | Fase 3 |
| `email_draft` | `executeEmailDraft` | To-fase (Gmail API) | Fase 3 |
| `document_generation` | `executeDocumentGeneration` | Transaksjonell | Fase 4 |
| `welcome_package` | `executeWelcomePackage` | Transaksjonell + Storage | Fase 4 |
| `bug_fix` | `executeBugFix` | Transaksjonell (oppretter task + varsler dev_agent) | Fase 5 |

#### 6.5.3 Transaksjonelt mønster

**Viktig:** Proposal-eksekvering bruker den **direkte `postgres`-driveren** (seksjon 2.1), ikke Supabase-klienten. Begrunnelsen er at vi trenger ekte transaksjoner med `for update`-låsing, noe Supabase REST-klienten ikke støtter.

For handlinger som kun rører databasen, bruker handleren postgres-template-syntaks inne i en transaksjon:

```ts
// apps/hub/lib/proposals/executors/phase-transition.ts
import { db } from '@/lib/db/transactional';

export async function executePhaseTransition(
  payload: PhaseTransitionPayload,
  ctx: ExecutionContext
): Promise<ExecutionResult> {
  return await db.begin(async (sql) => {
    // 1. Lås kunderaden og verifiser optimistic lock
    const [company] = await sql`
      select id, phase
      from companies
      where id = ${payload.company_id}
      for update
    `;

    if (!company) {
      throw new ExecutionError('not_found', 'Kunden finnes ikke');
    }

    if (company.phase !== payload.from_phase) {
      throw new ExecutionError(
        'stale',
        `Forventet ${payload.from_phase}, fant ${company.phase}`
      );
    }

    // 2. Utfør hovedoperasjonen
    // closed_at settes automatisk av set_closed_at_on_finished-trigger
    // når phase endres til 'finished' – vi setter det IKKE her manuelt
    await sql`
      update companies
      set phase = ${payload.to_phase},
          updated_at = now()
      where id = ${payload.company_id}
    `;

    // 3. Logg til activity_log
    await sql`
      insert into activity_log (
        id, actor_type, actor_name, action, entity_type, entity_id,
        company_id, details, created_at
      ) values (
        ${uuidv7()},
        'agent',
        ${ctx.proposal.agent_name},
        'company.phase_changed',
        'company',
        ${payload.company_id},
        ${payload.company_id},
        ${sql.json({ from: payload.from_phase, to: payload.to_phase })},
        now()
      )
    `;

    return { ok: true };
  });
}
```

Hvis transaksjonen feiler: `db.begin` ruller tilbake automatisk. Wrapper-koden i `executeProposal` fanger feilen og markerer proposal som `execution_failed` med `execution_error` satt – **aldri** `rejected`, fordi mennesket har allerede sagt ja på dette tidspunktet.

**Hvilken klient bruker hvilken handler:**

- **Direkte `postgres` (transaksjonell):** `phase_transition`, `task_creation`, `customer_update`, `document_generation`. Disse er rene database-operasjoner som drar nytte av ACID.
- **Supabase-klient (CRUD-stil):** Ingen handlere. Hvis en handler kun gjør én enkelt insert/update uten behov for låsing, kan den i prinsippet bruke Supabase-klienten – men for konsistens i kodebasen bruker vi `postgres` for alle handlere.
- **Hybrid (to-fase, ekstern API + postgres):** `calendar_event`, `email_draft`, `welcome_package`, `bug_fix`. Se 6.5.4.

#### 6.5.4 To-fase mønster (ekstern API)

For handlinger som krever ekstern API før database-oppdatering. Eksempel `calendar_event`:

```ts
// apps/hub/lib/proposals/executors/calendar-event.ts
import { db } from '@/lib/db/transactional';
import { googleCalendar } from '@/lib/google-calendar';

export async function executeCalendarEvent(
  payload: CalendarEventPayload,
  ctx: ExecutionContext
): Promise<ExecutionResult> {
  // Fase 1: Prepare – kall ekstern API
  let externalRef: string;
  try {
    externalRef = await googleCalendar.createEvent({
      title: payload.title,
      start: payload.start,
      end: payload.end,
      attendees: payload.attendees,
    });
  } catch (err) {
    return { ok: false, error: 'calendar_api_failed', details: err.message };
  }

  // Fase 2: Commit – lagre referanse i database
  try {
    await db.begin(async (sql) => {
      await sql`
        insert into calendar_events (
          id, company_id, google_event_id, google_calendar_id,
          title, start_at, end_at, attendees,
          created_by_proposal_id, created_by_agent, created_at
        ) values (
          ${uuidv7()},
          ${payload.company_id},
          ${externalRef},
          ${payload.calendar_id},
          ${payload.title},
          ${payload.start},
          ${payload.end},
          ${sql.json(payload.attendees)},
          ${ctx.proposal_id},
          ${ctx.proposal.agent_name},
          now()
        )
      `;

      await sql`
        insert into activity_log (...)
        values (...)
      `;
    });

    return { ok: true };
  } catch (err) {
    // Sjelden tilfelle: API lyktes men DB feilet
    // Logg ALARM – noen må rydde opp manuelt
    // Proposal markeres execution_failed (ikke rejected) – mennesket sa ja, men noe gikk galt
    await createSystemAlert({
      severity: 'critical',
      source: 'proposal_execution',
      message: `Calendar event ${externalRef} opprettet i Google men ikke lagret i Hub. Krever manuell rydding.`,
    });
    return { ok: false, error: 'partial_failure', external_ref: externalRef };
  }
}
```

Dette er bevisst ikke "perfekt" – det er en pragmatisk avveining. Sannsynligheten for at fase 2 feiler etter at fase 1 har lyktes er svært lav, og når det skjer er det bedre med en alarm enn et komplekst distribuert transaksjonsystem.

#### 6.5.5 Faseovergangsmatrise

Tillatte fase-overganger valideres både ved proposal-opprettelse (i `POST /api/agent/proposals`) og ved eksekvering:

| Fra | Tillatte til (fremover) | Bakover |
|---|---|---|
| `lead` | `qualification` | – |
| `qualification` | `sales` | `lead` |
| `sales` | `onboarding` | `qualification` |
| `onboarding` | `training` | `sales` |
| `training` | `operational` | `onboarding` |
| `operational` | `finished` | `training` |
| `finished` | – (terminal) | `operational` (kun via service role) |

**Regler:**
- **Fremover:** Kun ett trinn av gangen. `lead → onboarding` er forbudt
- **Bakover:** Kun ett trinn av gangen. **Bakover-overganger kan kun foreslås av mennesker, aldri av agenter.** Dette håndheves som en hard regel i `POST /api/agent/proposals`: hvis request kommer fra en agent (auth via JWT med `sub` som er et agentnavn) og `payload.action_type = 'phase_transition'` med en bakover-overgang, returneres 403 med error `agents_cannot_propose_backward_transitions`. Bakover-forslag opprettes manuelt fra Hub-UI med Magnus eller Martin som `created_by`
- **`finished` er terminal** for vanlig flyt. Reaktivering krever eksplisitt service role-funksjon (`force_reopen_finished_company`) som logger til `activity_log` med advarsel
- **Agent-API validerer** at proposal-payload har en gyldig overgang før den lagres – inkludert avvisning av bakover-overganger fra agenter
- **Eksekvering verifiserer** med optimistic lock at `companies.phase` fortsatt matcher `payload.from_phase` – hvis ikke, proposalen er stale og må re-vurderes manuelt

#### 6.5.6 Konflikthåndtering (optimistic locking)

To agenter kan tenkbart foreslå motstridende handlinger på samme kunde. Eksempel: Agent 3 foreslår `qualification → sales` mens Agent 6 foreslår `qualification → lead` (basert på ny info). Magnus kan godkjenne begge i feil rekkefølge.

**Mekanisme:**
- Hver `phase_transition`-payload inneholder `from_phase` (gjeldende fase da forslaget ble laget)
- Ved eksekvering låses raden med `select ... for update` og `companies.phase` sammenlignes med `payload.from_phase`
- Hvis det ikke matcher: handler kaster `ExecutionError('stale')`, transaksjonen rulles tilbake, og proposalen markeres `execution_failed` med `execution_error: 'stale'`. Den blir **ikke** `rejected` – mennesket godkjente i god tro, men staten hadde endret seg under godkjenningen
- Magnus får en feilmelding i UI: "Denne handlingen er ikke lenger gyldig fordi kunden har endret fase. Klikk 'Avvis' for å lukke, eller la en agent vurdere på nytt."

For andre `action_type` enn `phase_transition` er konflikt mindre kritisk:
- `task_creation` – flere oppgaver med samme tittel er mulig, men ikke skadelig
- `customer_update` – siste oppdatering vinner (last-write-wins er akseptabelt for kontaktdetaljer)
- `calendar_event` – Google Calendar håndterer duplikater på sin side

Hvis vi senere ser at flere felter trenger lock, oppgraderer vi til en `version`-kolonne på `companies` med inkrementering ved hver oppdatering.

#### 6.5.7 Reverse / angre

Etter eksekvering kan reversible handlinger angres innen 60 sekunder via en "Angre"-knapp i UI. Hver handler eksporterer optionalt en `reverse(payload, ctx)`-funksjon. Hvis den finnes, vises angreknappen.

For irreversible handlinger (e-post sendt, kontrakt signert) vises ingen angreknapp – og en advarsel vises *før* godkjenning, jf. PRD seksjon 4.3.

#### 6.5.8 Recovery fra `execution_failed`

Når en proposal havner i `execution_failed`, vises den som et rødt kort i UI med feilmeldingen og tre handlingsmuligheter:

1. **Prøv igjen** – oppretter en ny proposal med samme `payload` og `agent_name`, status `pending_approval`. Den feilede proposalen blir værende i historikken med status `execution_failed` for sporbarhet. Knappen er kun aktiv hvis feilen er retriable (`stale`, `calendar_api_failed`, `partial_failure` etter rydding) – ikke for permanente feil
2. **Avvis** – endrer status til `rejected` med en forklarende notat. Lukker saken endelig
3. **Eskaler** – oppretter en task tilordnet Magnus eller Martin med full feilkontekst. Brukes når det krever manuell intervensjon (typisk `partial_failure`-tilfeller der noe må ryddes i ekstern API før retry er trygt)

**Semantisk merknad om "Avvis":** Når en `execution_failed`-proposal markeres `rejected` via Avvis-knappen, skiller det seg fra det vanlige `rejected`-tilfellet (mennesket sa nei i utgangspunktet). Audit-sporet bevarer dette implisitt: en proposal med `execution_error` satt og deretter `rejected` betyr "godkjent, men teknisk feil, deretter manuelt lukket". Hvis dette skillet senere viser seg viktig for revisjon, kan vi legge til en egen `dismissed_after_failure`-status. For MVP holder vi enum-et minimalt.

Recovery-knappene vises kun for innloggede brukere – agenter kan ikke selv retry'e sine egne feilede forslag. Dette er bevisst: en agent som genererer dårlige forslag skal ikke kunne re-forsøke i loop. Mennesket er alltid i sløyfen.

---

## 7. Mappestruktur

### 7.1 Repo-oversikt

```
nerra-hub/
  apps/
    hub/
      app/
        (auth)/
          login/
        (app)/
          dashboard/
          customers/
            [companyId]/
          inbox/
          tasks/
          contracts/
          agents/
        api/
          health/                   # GET /api/health
            route.ts
          agent/                    # Agent-API – krever JWT
            proposals/
            companies/
            tasks/
            activity/
            runs/
            documents/
            emails/
            meetings/
            alerts/
            search/
          agent-auth/               # Token-utstedelse for agenter
            challenge/
              route.ts
            token/
              route.ts
          webhooks/                 # Eksterne webhooks (med signaturverifisering)
            slack/
            gmail/
            fireflies/
            contract-signed/
          cron/                     # Vercel Cron-endepunkter (auth via CRON_SECRET)
            tripletex-sync/         # Hvert 15. min
            gdpr-purge/             # Ukentlig
            system-purge/           # Daglig (revokerte tokens, expired proposals, audit-tabeller)
            proposal-watchdog/      # Hvert 5. min (stuck approved_pending_execution)
        layout.tsx
        globals.css
      components/
        dashboard/
        customers/
        inbox/
        tasks/
        contracts/
        agents/
        shared/
      lib/
        supabase/                   # REST-klient (CRUD, Realtime, Storage, Auth)
          server.ts
          client.ts
          service.ts
        db/                         # Direkte postgres-driver (transaksjoner, locking)
          transactional.ts
          queries.ts                # Soft-delete-helpers (activeCompanies osv.)
        proposals/                  # Proposal-eksekverings-rammeverk
          types.ts
          execute.ts                # executeProposal server action
          executors/                # En fil per action_type
            phase-transition.ts
            task-creation.ts
            customer-update.ts
            calendar-event.ts
            email-draft.ts
            document-generation.ts
            welcome-package.ts
            bug-fix.ts
        auth/
        agent-auth/                 # JWT-validering, scope-sjekk, rate limiting
        google-calendar/
        gmail/                      # OAuth, draft-creation
        tripletex/
        fireflies/
        slack/
        logger.ts                   # Strukturert logging med PII-redaction
        validators/                 # Zod-skjemaer
      middleware.ts
      next.config.ts
      tailwind.config.ts
      tsconfig.json
      package.json
    qualification-form/
      app/
        q/
          [slug]/
        api/
          submit/
      package.json
  packages/
    db/
      migrations/
        0001_initial.sql
        0002_phase_checklist.sql
        ...
      src/
        types.ts                    # Auto-generert fra Supabase
        client.ts
        queries.ts                  # Delte query-helpers (soft-delete osv.)
        index.ts
      package.json
    agents-sdk/
      src/
        client.ts                   # NerraHubClient
        proposal-schemas.ts
        types.ts
        index.ts
      package.json
    ui/
      src/
        button.tsx
        card.tsx
        ...
      package.json
    config/
      eslint/
      typescript/
      tailwind/
  package.json
  pnpm-workspace.yaml
  turbo.json                        # For å kjøre bygg/test parallelt
  README.md
```

### 7.2 Navnekonvensjoner

- **Filer:** kebab-case (`customer-card.tsx`)
- **Komponenter:** PascalCase (`CustomerCard`)
- **Hooks:** camelCase med `use`-prefiks (`useCompany`)
- **Server actions:** camelCase med verb-prefiks (`updateCompanyPhase`)
- **Database-tabeller:** snake_case
- **API-ruter:** kebab-case
- **Norske termer i UI** (kunder, oppgaver, godkjenning) – men engelske termer i kode (`customer`, `task`, `proposal`). Mapping skjer i komponenter.

---

## 8. Miljøvariabler

Alle hemmeligheter i Vercel Environment Variables (Hub) og Modal Secrets (agenter). Aldri i kode, aldri commitet.

### 8.1 Hub (Vercel)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # Server-only, ikke NEXT_PUBLIC_

# Direkte Postgres-tilkobling (transaction-mode pooler)
DATABASE_POOL_URL=                     # Server-only. postgres://[user]:[pass]@[host]:6543/postgres?sslmode=require
                                       # Brukes av postgres-pakken (porsager/postgres) for transaksjoner og locking
                                       # Hentes fra Supabase Dashboard > Settings > Database > Connection pooling > Transaction mode

# Auth
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=

# Agent-API – kortlivede tokens med rotasjon
AGENT_JWT_SIGNING_KEYS=                # JSON: { "agent-2026-04-001": "...", ... }
AGENT_JWT_ACTIVE_KID=agent-2026-04-001 # Hvilken nøkkel som signerer nye tokens
AGENT_SEED_KEYS=                       # JSON: { "agent_3_project": "...", ... }
AGENT_IP_ALLOWLIST_ENABLED=false       # Sett til true når Modal Proxies er aktivert
AGENT_IP_ALLOWLIST=                    # JSON: { "agent_3_project": ["3.x.x.x/32"], ... } – kun brukt hvis ENABLED=true
ALLOWED_AGENT_NAMES=ceo,agent_1,agent_2,...

# Public URL signing – HMAC med versjonering
QUALIFICATION_URL_HMAC_KEYS=           # JSON: { "qual-2026-04-001": "<32+ byte>", ... }
QUALIFICATION_URL_HMAC_ACTIVE_KID=qual-2026-04-001
CONTRACT_URL_HMAC_KEYS=                # JSON: { "contract-2026-04-001": "<32+ byte>", ... }
CONTRACT_URL_HMAC_ACTIVE_KID=contract-2026-04-001

# Logging og PII
LOG_HASH_KEY=                          # 32+ byte hemmelig n\u00f8kkel for HMAC-hashing av e-post/telefon i logger

# Slack
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=
SLACK_DEFAULT_CHANNEL=

# Gmail – Hub eier OAuth siden Hub er den som faktisk kaller Gmail API
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_PUBSUB_VERIFICATION_TOKEN=
GMAIL_OAUTH_REFRESH_TOKEN_MAGNUS=    # OAuth refresh token for magnus@nerra.com
GMAIL_OAUTH_REFRESH_TOKEN_MARTIN=    # OAuth refresh token for martin@nerra.com
GMAIL_OAUTH_REFRESH_TOKEN_CONTACT=   # OAuth refresh token for contact@nerra.com

# Fireflies
FIREFLIES_API_KEY=
FIREFLIES_WEBHOOK_SECRET=

# Tripletex (poll, ikke webhook)
TRIPLETEX_CONSUMER_TOKEN=
TRIPLETEX_EMPLOYEE_TOKEN=
CRON_SECRET=                           # Vercel Cron header-auth

# Sentry
SENTRY_DSN=                            # eu.sentry.io
SENTRY_AUTH_TOKEN=

# Misc
NEXT_PUBLIC_HUB_BASE_URL=https://hub.nerra.com
QUALIFICATION_FORM_BASE_URL=https://qualification.nerra.com
```

Nøkkelrotasjon, sjekklister og rotasjonsfrekvens dokumenteres i drift-runbook.

### 8.2 Agenter (Modal)

```env
NERRA_HUB_BASE_URL=https://hub.nerra.com
NERRA_AGENT_NAME=agent_3_project       # Hvilken agent dette er
NERRA_AGENT_SEED_KEY=                  # Langlivet seed, byttes mot kortlivet JWT
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SLACK_BOT_TOKEN=
TRIPLETEX_*=
FIREFLIES_API_KEY=
```

Hver agent har sin egen Modal-app med eget sett miljøvariabler – minimum nødvendig.

**Modal har aldri:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- Direkte Supabase-URL (utover det som brukes via Hub-API)
- HMAC-nøkler for qualification/contract slug-signering
- Signing-nøkler for agent-JWT (`AGENT_JWT_SIGNING_KEYS`)
- **Gmail OAuth refresh tokens** – eies kun av Hub. Agenter som vil sende e-post går via Hub Agent-API som så bruker Hub sine Gmail-credentials. Dette samler all e-post-eksekvering ett sted og gjør re-auth enklere

Alle databaseoperasjoner går via Hub Agent-API. Dette er den eneste måten Modal-agenter interagerer med Nerras data på.

---

## 9. Observability og logging

### 9.1 Korrelasjons-ID

Hver request gjennom systemet får en unik `request_id` (UUID v7). Dette ID-et følger requesten på tvers av Hub, Modal og eksterne kall.

- **Inngang:** Hub middleware genererer `request_id` for hver innkommende HTTP-request og setter det som `x-request-id`-header
- **Agent-kall:** Når Hub plasserer en jobb i `agent_queue`, lagres `request_id` i payload. Når agenten plukker opp jobben og kaller tilbake til Hub, sender den samme `request_id` i headeren.
- **Logging:** Alle strukturerte logger inkluderer `request_id`. Dette gjør det mulig å spore en handling fra brukerklikk → server action → agent-jobb → tilbakekall → endring i database.
- **Sentry:** Konfigureres til å inkludere `request_id` som tag på alle exceptions.

### 9.2 Strukturert logging

All logging i Hub bruker JSON-format (ikke `console.log` med strenger). Logger har minimum:

```jsonc
{
  "timestamp": "2026-04-07T14:23:01.234Z",
  "level": "info",
  "request_id": "0190a1b2-...",
  "actor": "agent_3_project",
  "action": "proposal.created",
  "company_id": "...",
  "duration_ms": 142,
  "details": { ... }
}
```

Vercel logger fanger dette automatisk og lar deg søke. For MVP er Vercel + Sentry tilstrekkelig – senere kan vi vurdere en dedikert log-pipeline (Axiom, Logflare).

### 9.2.1 Logging-rødliste (skal aldri logges)

Disse feltene må aldri nå loggene:
- **Hemmeligheter:** JWT-tokens, HMAC-signaturer, seed-nøkler, API-nøkler, OAuth-tokens
- **Rå e-postinnhold:** kropp, utkast, transkripsjoner
- **Personopplysninger i klartekst:** e-postadresser og telefonnumre skal HMAC-hashes (HMAC-SHA256 med `LOG_HASH_KEY`) før logging – slik at samme adresse kan spores på tvers av logger uten å eksponere verdien. HMAC (vs vanlig SHA-256 med statisk salt) er sterkere mot offline dictionary-angrep dersom en angriper får tilgang til logger uten å ha selve nøkkelen.
- **Kontraktpriser og betalingsdetaljer:** aldri logges utenfor databasen

**Implementering:** En `safeLogger`-wrapper i `apps/hub/lib/logger.ts` filtrerer payload før logging. Rødlisten er hardkodet som en Set av felt-navn. Hvis et objekt inneholder et felt fra rødlisten, erstattes verdien med `[REDACTED]`.

**Eksempel:**
```ts
safeLogger.info('proposal.created', {
  request_id,
  agent: 'agent_3_project',
  company_id: '...',
  proposal: {
    title: 'Flytt til fase Onboarding',
    // description ville blitt logget
    // payload.to (e-post) ville blitt redigert til [REDACTED]
  }
});
```

### 9.2.2 Korrelasjons-ID er ren intern

Korrelasjons-ID (`request_id`) **eksponeres aldri i kunde-facing innhold**:
- Ikke i e-poster til kunder
- Ikke i generert PDF eller kontrakter
- Ikke i kvalifiseringsskjema-grensesnittet
- Ikke i error-meldinger kunden ser

For support-sporing mot kunder brukes en separat, menneskelesbar sakskode hvis det noensinne blir nødvendig (f.eks. `NERRA-2026-0042`) – men dette er ikke en del av MVP.

### 9.3 Alarmer

Disse situasjonene trigger varsel til Slack via en dedikert `#nerra-alerts`-kanal:

- Webhook-feil (mer enn 3 feilede mottak innen 5 min fra samme kilde)
- Agent uten heartbeat på mer enn 5 min mens `status = 'running'`
- `agent_queue` har mer enn 50 jobber med `attempts > 3`
- Tripletex-poll feiler 3 ganger på rad
- Supabase connection pool eksponert (Sentry catch)
- Et hvilket som helst kritisk `system_alert` opprettet
- **Service role oppdaget brukt fra klientside** (bør aldri skje – en bug hvis det skjer)
- Agent-token utstedelse fra IP utenfor hvitliste (sikkerhetshendelse)
- Mer enn 10 401/403-svar fra agent-API på 5 min (brute-force-mistanke)
- **Gmail OAuth-token revokert** (Google returnerer `invalid_grant`) – krever manuell re-auth via Google Cloud Console. Når dette skjer logges hvilken konto (`magnus@`/`martin@`/`contact@`) som må re-autentiseres, og Innboks-siden viser et banner med instruksjoner

Alarmer går aldri direkte til kunde. Alle alarmer er interne.

### 9.4 Data-minimering til LLM

Agent-SDK-et håndhever hvilke felter som kan sendes til LLM-leverandører (Anthropic, OpenAI). Dette er et ekstra lag utover lovlig behandling – formålet er å minimere data-eksponering.

**Rødliste (aldri sendt til LLM):**
- Organisasjonsnummer
- Fødselsnummer eller tilsvarende ID
- Bankkontonummer
- Kredittkortnummer
- Rå passord eller tokens
- Detaljerte fakturalinjer med beløp

**Gulliste (krever eksplisitt opt-in per agent):**
- Kontraktpris og betalingsstatus
- Detaljert økonomihistorikk
- Full e-posthistorikk

**Grønnliste (standard tilgjengelig):**
- Firmanavn, kontaktperson, e-post, telefon (nødvendig for meningsfulle prompts)
- Fase, status, oppgaver
- Møte-sammendrag (ikke rå transkripsjon)
- Research-dokumenter og notater

**Implementering:** `NerraHubClient.getContextForLlm(companyId, { include })` i `packages/agents-sdk` filtrerer response basert på agentens scopes og en eksplisitt inkluderingsliste. Default er grønnlisten.

### 9.5 Test-strategi

For MVP er ambisjonen pragmatisk:

- **Vitest** for enhetstester på Zod-skjemaer, validering, agent-SDK-klient
- **Vitest med Supabase test container** for kontrakttester mellom Zod-skjemaer og database (sikrer at en `proposal_payload` med `action_type = 'phase_transition'` faktisk lar seg insert'e)
- **Migrasjonssnapshot:** En test som kjører alle migrasjoner mot tom database og snapshotter sluttskjemaet. PR-er som endrer skjemaet uten oppdatert snapshot feiler i CI.
- **Playwright** for tre kritiske E2E-flyter: (1) login og redirect, (2) opprett kunde manuelt, (3) godkjenn et forslag.
- Ingen 100% coverage-mål. Test der det er reell risiko, ikke for syns skyld.

---

## 10. GDPR og databehandling

### 10.1 Lagringssted

- All kundedata lagres i Supabase EU-Frankfurt
- Supabase Storage (samme region) for binære filer
- Vercel hosting i EU-region
- Modal-agenter kjører i US-region men lagrer ingen kundedata permanent
- Anthropic og OpenAI er databehandlere under EU-US Data Privacy Framework – data behandles, ikke lagres
- Sentry er konfigurert med `eu.sentry.io` (EU-region)
- Fireflies er databehandler – DPA signeres før produksjon

### 10.2 Retention og purge

PRD seksjon 14.3 sier "5 år for alt knyttet til en kunde". Dette implementeres som en cron-job:

- `/api/cron/gdpr-purge` kjører ukentlig
- Finner kunder med `phase = 'finished'` og `closed_at < now() - interval '5 years'`
- **Viktig:** `closed_at` er immutabelt – satt én gang når kunden flyttes til `finished` og aldri endret etterpå. Dette forhindrer at retention-klokken "nullstilles" hvis en gammel kundeprofil tilfeldigvis oppdateres (f.eks. ved en datakorrigering)
- Sletter kunde + alle FK-relaterte rader (cascade håndterer det meste)
- Sletter Supabase Storage-filer knyttet til kunden
- Sletter Fireflies-opptak via API
- Logger sletting til en separat `gdpr_deletions`-tabell (kun firmanavn + slettetidspunkt + årsak, ingen PII)

I tillegg finnes manuell GDPR-funksjonalitet i Hub:

- **Eksporter all data om en kunde** (JSON + tilhørende filer som zip)
- **Slett en kunde og alt tilhørende** (med bekreftelse, irreversibelt)

Begge er bygget i Fase 4 av MVP.

#### 10.2.0 Systemtabeller med egen retention

Disse tabellene vokser ubegrenset hvis ikke trimmet. Egen cron-job `/api/cron/system-purge` kjører daglig:

| Tabell | Retention | Begrunnelse |
|---|---|---|
| `revoked_agent_tokens` | 90 dager etter token-utløp | Trygt å slette etter at originaltokenet uansett er utløpt – revokering trengs ikke lenger. Cron sletter rader hvor `expires_at < now() - interval '90 days'` |
| `agent_token_audit` | 90 dager | Audit-spor for token-utstedelse trengs kun for ferskt forensisk arbeid |
| `agent_auth_nonces` | 1 time etter `expires_at` | Nonces er one-time-use og levetiden er 60 sek – beholdes kun litt etter for debugging |
| `auth_rate_limit_buckets` | 2 timer etter `window_start` | Trenger kun ferske vinduer for å håndheve grenser |
| `contract_views` | 365 dager | Visningssporing for kontrakter – beholdes lenger for sporbarhet ved tvister |
| `system_alerts` | 365 dager etter `acknowledged_at` | Erkjente alarmer kan slettes etter et år |
| `tripletex_sync_state` | Ingen sletting | Holder waterline-state, må alltid være tilgjengelig |

Cron-jobben logger antall slettede rader til strukturert logging og varsler `#nerra-alerts` hvis sletting feiler.

**I tillegg setter `system-purge`-cron-jobben utløpte proposals til `expired`-status:**

```sql
update proposals
set status = 'expired'
where status = 'pending_approval'
  and expires_at is not null
  and expires_at < now();
```

Dette kjøres som del av samme daglige cron, slik at gamle ubehandlede forslag rydder seg selv.

**Watchdog for stuck eksekveringer (kjøres hvert 5. minutt, ikke daglig):**

Hvis Vercel-funksjonen som eksekverer en proposal krasjer eller timer ut mellom statusen settes til `approved_pending_execution` og handler returnerer, blir proposalen hengende. UI viser "Behandler..." for alltid. En egen cron-jobb `/api/cron/proposal-watchdog` kjører hvert 5. minutt:

```sql
update proposals
set status = 'execution_failed',
    execution_error = 'execution_timeout',
    executed_at = now()
where status = 'approved_pending_execution'
  and decided_at < now() - interval '10 minutes';
```

Når dette skjer logges det også som `system_alert` med severity `warning` slik at Magnus kan sjekke om noe gikk galt mot ekstern API. Recovery-flyten i 6.5.8 lar ham deretter retry'e eller eskalere.

**10 minutter** er valgt fordi det er lengre enn enhver realistisk legitim eksekvering (Vercel max-execution er 60 sekunder for hobby, 300 for pro), men kort nok til at en stuck proposal ikke står lenge før Magnus får beskjed.

### 10.2.1 Logger og PII

Logger og Sentry-events kan inneholde PII (firmanavn, oppgavetitler, agent-handlinger med kunde-kontekst). Strategien:

- **Vercel-logger:** Konfigureres med 30 dagers retention. Etter 30 dager er logger automatisk borte.
- **Sentry:** EU-region (`eu.sentry.io`), 30 dagers retention på events. PII scrubbing aktivert i Sentry-prosjektkonfigurasjon. `before_send`-hook i Sentry-SDK-et redigerer e-post/telefon før event sendes.
- **Strukturerte logger:** Følger logging-rødlisten (seksjon 9.2.1). E-post og telefon hashes, hemmeligheter aldri logges.
- **Korrelasjons-ID:** Er ren UUID uten kobling til PII i seg selv. Kan eksistere i logger uten compliance-problem.
- **`activity_log`:** Behandles som kundedata og slettes ved GDPR-purge sammen med resten.

**Konsekvens:** En kunde som ber om sletting etter GDPR Article 17, får all rådata fjernet umiddelbart. Logger og Sentry-events utløper innen 30 dager – det dokumenteres i sletteresponsen til kunden.

### 10.2.2 Kryptering at rest

- **Supabase Postgres:** AES-256 kryptering at rest aktivert som standard
- **Supabase Storage:** AES-256 kryptering at rest aktivert som standard
- **Fireflies:** Bekreftet AES-256 at rest. DPA dekker dette.
- **Sentry:** AES-256 at rest, EU-region.

### 10.3 RPO og RTO

For et to-personers system med Supabase Pro:

- **RPO (Recovery Point Objective): 1 time** – Supabase point-in-time recovery håndterer dette automatisk
- **RTO (Recovery Time Objective): 4 timer** – tid det tar å gjenopprette fra backup hvis hovedinstansen kollapser
- iCloud-speiling og Google Sheet-speiling fungerer som ekstra backuplag (ikke primær gjenopprettingsmekanisme)

**PITR-test:** Restore-prosedyre testes kvartalsvis – se drift-runbook.

Dette er overraskende romslig for et MVP. Hvis senere kunder krever strengere SLA-er, kan vi flytte til Supabase Team eller dedikert database.

### 10.4 Modellbehandling og personvernerklæring

Personvernerklæringen skal eksplisitt nevne:

- Vi bruker AI-leverandører (Anthropic, OpenAI) basert i USA
- Behandlingen skjer under EU-US Data Privacy Framework
- Behandlingen er transient – ingen lagring hos leverandør utover responstid
- DPA-er er signert med begge leverandører
- Brukeren kan be om innsyn i hvilke data som har blitt behandlet av AI
- Vi minimerer hvilke felter som sendes til AI-leverandører (se 9.4)

---

## 11. Lokal utvikling og deploy

### 11.1 Lokal utvikling

- `pnpm install` i root
- `pnpm dev` (Turbo kjører hub + qualification-form parallelt)
- `pnpm db:start` starter lokal Supabase via Supabase CLI (Docker)
- `pnpm db:migrate` kjører migrasjoner
- `pnpm db:types` regenererer TypeScript-typer fra skjemaet
- `.env.local` per app, gitignored

### 11.2 Deploy

- **Hub:** Vercel, EU-region (Frankfurt). Auto-deploy fra `main`. PR previews aktivert.
- **Qualification form:** Egen Vercel-prosjekt, samme repo, eget custom domain.
- **Database-migrasjoner:** Kjøres manuelt fra Supabase CLI mot prod for MVP. Senere automatisert via GitHub Actions.
- **Modal-agenter:** Deployes via `modal deploy` fra `nerra-agents`-repo. Manuelt for MVP.

### 11.3 Branch- og PR-strategi

- `main` = produksjon. Beskyttet branch.
- Alle endringer går via PR, godkjennes av Magnus etter at agent-flyten (Opus skriver, Codex reviewer, Sikkerhetsagent sjekker, QA tester) er gjennomført.
- Conventional commits (`feat:`, `fix:`, `chore:` ...).
- En PR per logisk endring – aldri massive blandede commits.

### 11.4 CI/CD-minstekrav

Alle PR-er må passere disse sjekkene før merge til `main`. GitHub Actions konfigureres med branch protection rules som blokkerer merge ved feil.

**Pipeline-trinn:**

1. **Lint:** ESLint + Prettier-sjekk på all kode. Inkluderer den ESLint-regelen som forbyr import av `service.ts` utenfor godkjente lokasjoner (seksjon 4.1).
2. **Type-check:** `tsc --noEmit` på alle apper og pakker.
3. **Migrasjonssnapshot:** Kjør alle migrasjoner mot tom Postgres, dump skjema, sammenlign mot committet snapshot. Avvik feiler bygget.
4. **Enhetstester:** `vitest run` mot alle pakker.
5. **Kontrakttester:** Vitest med Supabase test container – verifiserer at Zod-skjemaer matcher faktisk database.
6. **E2E smoke:** Playwright kjører tre kritiske flyter mot preview deployment: login, opprett kunde, godkjenn forslag.
7. **Sikkerhetssjekk:** `pnpm audit` med threshold på "high". Kjente kritiske CVE-er feiler bygget.

**Hastetilfelle (hotfix):** Trinn 6 (E2E) kan hoppes over med eksplisitt PR-label `skip-e2e` og en commit-melding som forklarer hvorfor. Trinn 1–5 og 7 kan aldri hoppes over.

**Deploy-trigger:** Etter merge til `main` deployer Vercel automatisk. Database-migrasjoner kjøres manuelt fra Supabase CLI før merge (eller automatisert i senere iterasjon).

### 11.5 Migrasjoner skal være bakoverkompatible

Fordi databasemigrasjoner kjøres *før* appen deployes, men gammel kode kjører i mellomtiden, må alle migrasjoner være bakoverkompatible med forrige app-versjon. Dette er en hard regel.

**Tillatte mønstre:**
- Legge til nye tabeller
- Legge til nye nullable kolonner
- Legge til nye indekser
- Legge til nye enum-verdier
- Lage nye triggere som ikke endrer eksisterende data

**Forbudte i én migrasjon:**
- Slette en kolonne som gammel kode fortsatt bruker
- Endre en kolonnetype på en måte gammel kode ikke kan håndtere
- Renavne en tabell eller kolonne
- Fjerne en enum-verdi
- Legge til en `not null`-kolonne uten default value på en tabell med data

**Mønster for breaking changes (to-fase deploy):**

1. **Migrasjon A:** Legg til ny kolonne, behold gammel
2. **App-deploy:** Ny kode skriver til både gammel og ny kolonne, leser fra ny
3. **Migrasjon B (uker senere):** Slett gammel kolonne
4. **App-deploy:** Fjern dual-write

For renaming:

1. **Migrasjon:** Legg til ny kolonne med samme data
2. **App:** Bytt over til ny kolonne
3. **Migrasjon:** Slett gammel

Dette er kjedelig, men det er prisen for null-downtime deploy. Alternativet er planlagt vedlikehold-vinduer som vi ikke trenger å lage et system for nå.

### 11.6 Agent-SDK-versjonering

`packages/agents-sdk` lever i Hub-repoet, men brukes av agenter i `nerra-agents`-repoet. To repoer som må holdes i synk.

**Distribusjon:**
- SDK-en publiseres som en privat npm-pakke til **GitHub Packages**
- Versjon følger semver (`major.minor.patch`)
- Hub-repoet publiserer ny versjon ved hver merge til `main` der `packages/agents-sdk` har endringer
- `nerra-agents`-repoet `pnpm install`-er pakken med eksplisitt versjon (ikke `latest`)

**Breaking change-prosess:**
1. Hub legger til ny API-endpoint eller nytt felt på eksisterende endpoint, beholder gammel
2. SDK bumpes til ny minor-versjon med både gammel og ny API
3. Agenter oppdateres til ny SDK-versjon, bytter over til ny API
4. Etter at alle agenter bruker ny API: Hub fjerner gammel API, SDK bumper major

**Versjonskompatibilitet:**
- Hub støtter to siste minor-versjoner av SDK samtidig
- Agenter må aldri kjøre med en SDK-versjon eldre enn `Hub-versjon - 2 minors`
- En sjekk i `/api/health` returnerer min-supportert SDK-versjon, og agent-SDK logger advarsel hvis den er for gammel

---

## 12. Byggerekkefølge for MVP

PRD-en lister 17 moduler. De bygges i seks faser. Hver fase resulterer i et deployerbart system.

**Viktig prinsipp:** Magnus bygger ikke Hub manuelt. Han dirigerer en utvikleragent som skriver koden. Derfor må *agent-infrastrukturen* eksistere før Hub-bygging starter. Fase 0 er delt i to: Fase 0a etablerer den første utvikleragenten, Fase 0b lar agenten bygge Hub-fundamentet.

### Fase 0a – Første utvikleragent (uke 1)

Mål: Magnus har en funksjonell utvikleragent som kan skrive kode på kommando.

- `nerra-agents`-repo opprettet på GitHub
- Modal-konto satt opp (Starter eller Team Plan – se beslutning 4)
- Første utvikleragent deployet på Modal:
  - Trigger via Slack: `/dev <oppgave>` i en dedikert kanal
  - Bruker Anthropic API direkte (Claude Opus 4.6)
  - Har lese- og skrivetilgang til en gitt GitHub-repo via personal access token
  - Kan opprette branch, skrive filer, commite, åpne PR
  - Magnus reviewer alt manuelt før merge
- Slack-bot satt opp med minimal kanal-struktur (`#nerra-dev`, `#nerra-alerts`)
- Anthropic API-konto med billing
- GitHub Personal Access Token med scoped tilgang

**Ingen Hub-API ennå.** Agenten snakker ikke med Hub – den finnes ikke. Den snakker med GitHub direkte.

**Leveranse:** Magnus kan skrive `/dev sett opp tomt Next.js-prosjekt med TypeScript og Tailwind` i Slack, agenten gjør det, åpner PR, Magnus reviewer og merger.

### Fase 0b – Hub-fundamentet (uke 2, bygges av Fase 0a-agenten)

Mål: Tomt Hub-skjelett i prod, med utvikleragenten som primær builder.

- `nerra-hub`-repo opprettet, agenten dirigeres til å sette opp:
  - pnpm workspace, Turbo, ESLint, Prettier, TypeScript strict
  - Next.js-skjelett for `apps/hub` med shadcn/ui satt opp
  - Tomme `packages/db`, `packages/agents-sdk`, `packages/ui`, `packages/config`
- Supabase-prosjekt opprettet manuelt (EU-Frankfurt) – Magnus gjør dette, agenten kan ikke
- Auth med Google OAuth + e-post-whitelist
- Tomt dashboard som viser "Innlogget som Magnus"
- Vercel deploy fra `main` til `hub.nerra.com`
- Sentry koblet til (eu.sentry.io)
- `/api/health` fungerer

**Leveranse:** Magnus og Martin kan logge inn på en tom Hub. Ingen funksjonalitet, men hele toolingen funker. Utvikleragenten har bygd det meste.

### Fase 1 – Kunder uten agenter (uke 3)
Mål: Manuell kundehåndtering ende-til-ende.
- Database-migrasjoner: `companies`, `contacts`, `customer_dwa_details`, `customer_economy`, `phase_checklist_items`, `activity_log`
- Alle systemtabeller for sikkerhet: `agent_auth_nonces`, `agent_token_audit`, `revoked_agent_tokens`, `auth_rate_limit_buckets`
- Kundeliste med søk og filter
- Kundeprofil med alle felter, faseendring manuelt, oppgaveliste per fase
- Opprett kunde manuelt via Hub (ikke Slack ennå)
- Aktivitetslogg som viser hvem som endret hva
- `closed_at`-trigger på `companies`
- Soft delete-helpers i `packages/db/queries.ts`

**Leveranse:** Hub kan brukes som manuell CRM. Hvis alt annet kollapser, har Nerra fortsatt et fungerende system.

### Fase 2 – Oppgaver, dashboard, agentfundament (uke 4–5)
Mål: Strukturert daglig drift + agenter kan begynne å skrive til Hub via API.
- `tasks`-tabellen og full oppgavemodul
- Dashboard med "Mine oppgaver", "I dag", kundepipeline, aktivitetslogg, kommende hendelser (mock for kalender)
- Økonomibar med placeholder-tall
- `proposals`-tabellen og godkjenningskø-UI på dashboardet
- **Proposal-eksekverings-rammeverket** (seksjon 6.5): server actions, handler-katalog, første handler `phase_transition`
- **Faseovergangsmatrise** og optimistic locking implementert
- Agent-API: `/api/agent-auth/challenge`, `/api/agent-auth/token`, `/api/agent/proposals`, `/api/agent/tasks`, `/api/agent/companies`, `/api/agent/activity`
- `packages/agents-sdk` med Zod-skjemaer, `NerraHubClient`-klasse, og token-håndtering
- Agent-API testet med en dummy-agent som oppretter et forslag og verifiserer eksekvering
- **Agent 3 (Prosjektstyring)** deployes på Modal som første ekte agent og foreslår fase-overganger basert på checklist-status

**Leveranse:** Første ekte agent-til-Hub-loop er live. Agent foreslår, Magnus godkjenner, Hub eksekverer.

### Fase 3 – Integrasjoner (uke 6–8)
Mål: Hub henter data fra omverdenen.
- Slack: bot-integrasjon, kundeopprettelse via Slack-kommando, godkjenningsknapper i Slack synkronisert med Hub
- Gmail: OAuth, push via Pub/Sub, `emails`-tabell, Innboks-side i Hub
- Tripletex: kundenivå-økonomi, dashboard-nøkkeltall, daglig sync-job med idempotens og waterline
- Google Calendar: hent kommende hendelser, opprett events fra forslag (to-fase mønster)
- Fireflies: webhook, `meetings`-tabell, Agent 1 (møtereferent-bro)
- `agent_runs` + `agent_queue` med job locking + agentside med live status og kontrollknapper
- `system_alerts` med røde bannere

**Leveranse:** Hub er den daglige driftsplattformen. Magnus og Martin slutter å jobbe utenfor den.

### Fase 4 – Kundereise og dokumenter (uke 9–11)
Mål: Hele kundeflyten fra lead til signert kontrakt.
- Kvalifiseringsskjema som egen Next.js-app med signert HMAC-token
- Research-agent (Agent 6) som genererer dokumenter etter kvalifiseringsskjema-innsending
- Kunderapporter (3 nivåer) – Initial rapport, profilkort, dashboard-mini
- Welcome Package-generering
- Kontraktgenerering (PDF i MVP, ikke integrert e-signering)
- Public contract view via signert URL
- iCloud-speiling og Google Sheet-speiling som bakgrunnsjobber
- GDPR-funksjonalitet: eksport per kunde, sletting per kunde
- GDPR-purge cron-job

**Leveranse:** Første ekte kunde kan håndteres ende-til-ende.

### Fase 5 – Selvutviklende system (uke 12+)
Mål: Hub utvider seg selv.
- Bug-undersøkelses-agenten på Codex
- DWA-bug-håndteringsflyt
- Sikkerhetsagent som del av QA-flyt
- Søkeagent (naturlig språk-søk via Slack)
- Kursmentor (Agent 9) når DWA-plattformen er klar
- Modal Proxies aktivert (hvis Team Plan), IP-hvitliste på (Modus A)

**Leveranse:** Systemet blir bedre uten at Magnus skriver kode manuelt.

---

## 13. Beslutninger som må tas før Fase 0

Det er fem ting som trenger en avklaring fra deg før jeg kan gå videre:

1. **Domeneoppsett:** Skal Hub ligge på `hub.nerra.com` eller `nerra.com/hub` eller noe annet? Hva slags DNS-oppsett har du i dag?
2. **Supabase-konto:** Har du allerede en Supabase-organisasjon, eller skal vi opprette ny? EU-Frankfurt eller EU-Dublin?
3. **GitHub-organisasjon:** Skal repoet ligge under en `nerra`-org eller på din personlige konto?
4. **Modal-konto og plan:** Allerede satt opp, eller starter vi fra null? Starter vi på Starter Plan (ingen Proxies, IP-binding av) eller Team Plan (Proxies tilgjengelig, IP-binding på)? MVP er designet for å fungere uten Proxies, men hvis du allerede har Team Plan kan vi aktivere det fra start.
5. **Anthropic og OpenAI API-tilgang:** Egne API-konti med billing satt opp? Anthropic Claude Code Max-abonnement separat fra API-konto?

Jeg trenger ikke svar nå – men disse må være på plass før vi commiter første linje kode.

---

## 14. Det som ikke er spesifisert ennå

Ting denne spesifikasjonen bevisst lar være å låse:

- **Eksakt feltsett i kvalifiseringsskjema** – egen PRD (planlagt)
- **Eksakt design og animasjoner** – Hub følger samme designspråk som DWA-kursplattformen, men en egen design-pass kommer i Fase 0/1
- **Tripletex-feltmapping** – avklares når Tripletex-integrasjonen bygges
- **Eksakt prompt og logikk per agent** – egen mini-PRD per agent
- **Backup-rotasjon og restore-prosedyre** – dokumenteres som drift-runbook senere
- **Recurring tasks-logikk:** `tasks.recurrence` er definert som JSONB-felt, men hvordan oppgaver faktisk gjentas er ikke implementert. Sannsynlig løsning: cron-job som ved `completed_at` på en recurring task oppretter neste forekomst basert på `recurrence`-config. Spesifiseres når det bygges (Fase 4+)
- **Kontrakt-ettertilgang:** Skal kunder kunne åpne signerte kontrakter via lenke i etterkant? To alternativer beskrevet i 5.4.3, beslutning fattes før Fase 4
- **Modal Proxies-aktivering:** MVP starter uten, evalueres ved første ekte kunde (Fase 4)
- **Versjonshistorikk på dokumenter:** `documents`-tabellen har `updated_at`, men ingen egen versjonshistorikk. Hvis det blir behov, legges en `document_versions`-tabell til senere
- **`POST /api/agent/search`-format:** Søkeagentens endpoint har scope og er listet i API-katalogen, men input/output-format og hva den faktisk søker i (Postgres full-text? Vector embeddings? Bare structured queries?) er ikke spesifisert. Avklares når søkeagenten bygges (Fase 5)
- **Pgbouncer-tuning:** Detaljert connection pool-konfigurasjon (max connections, statement timeout) dokumenteres i drift-runbook når vi ser produksjonsbelastning

---

## 15. Relaterte dokumenter

- **PRD: Nerra Hub v2.0** – funksjonell spesifikasjon
- **Nerras operasjonshåndbok v1.2** – agent-arkitektur og selskapskontekst
- **Drift-runbook for Nerra Hub** – nøkkelrotasjon, PITR-test, log retention, restore-prosedyre, sjekklister
- **PRD: Kvalifiseringsskjema** – planlagt
- **PRD: Dokumentgenerering** – planlagt
- **PRD: DWA-kursplattform** – planlagt
