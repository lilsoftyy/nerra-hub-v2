# Fase 1: Customers Without Agents — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manual CRM. Create customers, change phases, track activity. If everything else collapses, Nerra has a working system.

**Architecture:** Supabase migrations for all Fase 1 tables, RLS policies, triggers. Next.js Server Components for list/detail pages. Server Actions for mutations. Supabase JS client for CRUD.

**Tech Stack:** Supabase Postgres, Supabase JS, Next.js 15 Server Components, Server Actions, shadcn/ui, Zod

**Source spec sections:** 3.1-3.4 (data model), 4.1-4.2 (RLS), 5.1 (auth), 7.1 (folder structure), 12 Fase 1

---

## Task Dependencies

```
Task 1 (DB migration: enums + tables)
  ├── Task 2 (RLS policies + triggers)
  │     └── Task 4 (Supabase types generation)
  │           ├── Task 5 (Customer list page)
  │           ├── Task 6 (Customer detail page)
  │           ├── Task 7 (Create customer form)
  │           └── Task 8 (Activity log component)
  └── Task 3 (Soft delete helpers in packages/db)

Task 5-8 can run in parallel after Task 4.
```

---

## Task 1: Database Migration — Enums and Tables

**Files:**
- Create: `packages/db/migrations/0001_enums.sql`
- Create: `packages/db/migrations/0002_profiles.sql`
- Create: `packages/db/migrations/0003_companies.sql`
- Create: `packages/db/migrations/0004_contacts.sql`
- Create: `packages/db/migrations/0005_customer_details.sql`
- Create: `packages/db/migrations/0006_phase_checklist.sql`
- Create: `packages/db/migrations/0007_activity_log.sql`
- Create: `packages/db/migrations/0008_security_tables.sql`

All migrations follow spec sections 3.2 and 3.3. Key rules from spec 3.1:
- UUID v7 PKs, no database defaults — app sets IDs
- `created_at` and `updated_at` on all tables via triggers
- Soft delete via `deleted_at` on companies and contacts
- Partial index `where deleted_at is null` on soft-deletable tables
- Snake_case in database
- All foreign keys have explicit `on delete` strategy
- All enum types from spec 3.2 (even those used in later phases — create them now)

### 0001_enums.sql
All enum types from spec 3.2:
```sql
create type customer_phase as enum ('lead','qualification','sales','onboarding','training','operational','finished');
create type task_status as enum ('open','in_progress','done','cancelled');
create type task_priority as enum ('low','medium','high','critical');
create type task_category as enum ('sales','training','admin','development','research','other');
create type proposal_status as enum ('pending_approval','rejected','approved_pending_execution','executed','execution_failed','expired');
create type proposal_action_type as enum ('phase_transition','task_creation','customer_update','calendar_event','email_draft','document_generation','welcome_package','bug_fix','other');
create type document_kind as enum ('research','customer_report','welcome_package','contract','briefing','other');
create type agent_run_status as enum ('queued','running','paused','completed','failed','cancelled');
create type email_category as enum ('customer_lead','customer_qualification','customer_sales','customer_onboarding','customer_training','customer_operational','dwa_bug','dwa_question','dwa_certification','partner','other');
create type contract_status as enum ('draft','sent','viewed','signed','declined','expired');
create type document_visibility as enum ('internal','customer_shareable');
create type alert_severity as enum ('info','warning','critical');
```

### 0002_profiles.sql
From spec 3.3.1:
```sql
create table profiles (
  id uuid primary key,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Trigger: auto-create profile from auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 0003_companies.sql
From spec 3.3.2. Include all columns, indexes, soft delete partial index.

### 0004_contacts.sql
From spec 3.3.3. Include unique constraint for is_primary per company_id.

### 0005_customer_details.sql
customer_dwa_details (spec 3.3.4) and customer_economy (spec 3.3.5) in one migration.

### 0006_phase_checklist.sql
phase_checklist_items (spec 3.3.7). Include the seed trigger that creates items when a company is inserted.

### 0007_activity_log.sql
activity_log (spec 3.3.10). Include indexes on created_at desc, company_id + created_at desc, actor_name.

### 0008_security_tables.sql
agent_auth_nonces (3.3.19), agent_token_audit (3.3.20), revoked_agent_tokens (3.3.21), auth_rate_limit_buckets (3.3.22).

### Shared triggers
Create `set_updated_at` trigger function and apply to all tables with `updated_at`.
Create `set_closed_at_on_finished`, `prevent_closed_at_modification`, `block_closed_phase_change` triggers on companies (spec 3.4).
Create `log_to_activity` triggers on companies (phase change) — spec 3.4.

Run all migrations via Supabase MCP execute_sql tool.

---

## Task 2: RLS Policies

**Applied via:** Supabase MCP execute_sql

From spec 4.1-4.2:

**Mal A (full access for @nerra.no):** profiles, companies, contacts, customer_dwa_details, customer_economy, phase_checklist_items, activity_log
```sql
alter table <table> enable row level security;
create policy "nerra_users_full_access" on <table>
  for all to authenticated
  using (auth.jwt() ->> 'email' like '%@nerra.no')
  with check (auth.jwt() ->> 'email' like '%@nerra.no');
```

**Mal C (service role only):** agent_auth_nonces, agent_token_audit, revoked_agent_tokens, auth_rate_limit_buckets
```sql
alter table <table> enable row level security;
-- No policies — only service role has access
```

NOTE: Spec says `@nerra.com` but correct domain is `@nerra.no`.

---

## Task 3: Soft Delete Helpers

**Files:**
- Modify: `packages/db/src/queries.ts`
- Modify: `packages/db/src/index.ts`

From spec 3.1: All queries against soft-deletable tables must use helper functions.

```ts
// packages/db/src/queries.ts
import { SupabaseClient } from '@supabase/supabase-js';

export function activeCompanies(supabase: SupabaseClient) {
  return supabase.from('companies').select().is('deleted_at', null);
}

export function activeContacts(supabase: SupabaseClient) {
  return supabase.from('contacts').select().is('deleted_at', null);
}
```

---

## Task 4: Generate Supabase Types

Run `supabase gen types` via MCP tool to generate TypeScript types from the actual schema. Update `packages/db/src/types.ts`.

---

## Task 5: Customer List Page

**Files:**
- Create: `apps/hub/app/(app)/customers/page.tsx`
- Create: `apps/hub/components/customers/customer-list.tsx`
- Create: `apps/hub/components/customers/customer-list-filters.tsx`

Features:
- Table showing all active companies (using activeCompanies helper)
- Columns: name, phase (color-coded badge), country, assigned_to, created_at
- Search by company name (full-text)
- Filter by phase, country
- Click row to navigate to customer detail
- "Opprett kunde" button linking to create form

UI language: Norwegian (with correct æøå).

---

## Task 6: Customer Detail Page

**Files:**
- Create: `apps/hub/app/(app)/customers/[companyId]/page.tsx`
- Create: `apps/hub/components/customers/customer-header.tsx`
- Create: `apps/hub/components/customers/customer-info-card.tsx`
- Create: `apps/hub/components/customers/customer-contacts.tsx`
- Create: `apps/hub/components/customers/customer-dwa-details.tsx`
- Create: `apps/hub/components/customers/customer-economy.tsx`
- Create: `apps/hub/components/customers/phase-checklist.tsx`
- Create: `apps/hub/components/customers/phase-change-button.tsx`

Features:
- Full customer profile with all fields from companies table
- Contacts list (from contacts table)
- DWA details card (from customer_dwa_details)
- Economy card (from customer_economy, placeholder data for now)
- Phase checklist items for current phase
- Manual phase change (forward only, one step at a time per spec 6.5.5)
- Edit customer fields inline
- Activity log for this customer (Task 8 component)

---

## Task 7: Create Customer Form

**Files:**
- Create: `apps/hub/app/(app)/customers/new/page.tsx`
- Create: `apps/hub/components/customers/customer-form.tsx`
- Create: `apps/hub/lib/validators/company.ts` (Zod schema)
- Create: `apps/hub/app/(app)/customers/actions.ts` (Server Actions)

Features:
- Form with required fields: name, country, phase (default lead)
- Optional fields: website, org_number, operational_area, employee_count, etc.
- Add primary contact inline
- Zod validation
- Server Action creates company + seeds phase checklist items (trigger handles this)
- Redirects to customer detail after creation
- UUID v7 generated app-side

---

## Task 8: Activity Log Component

**Files:**
- Create: `apps/hub/components/shared/activity-log.tsx`

Features:
- Displays activity_log entries for a given company_id
- Shows: timestamp, actor (human name or agent name), action, details
- Sorted by created_at desc
- Used on customer detail page and later on dashboard
