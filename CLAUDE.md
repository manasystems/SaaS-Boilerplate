# Mana — Construction Estimating SaaS

## Project Overview

Mana is a web-based construction estimating SaaS. Tagline: "a better Excel for construction estimating, with an AI command bar, that produces professional bids — tuned to your vertical."

Beachhead market: small-to-mid civil contractors (sitework subs, paving contractors, utility contractors) under $20M revenue who are stuck in Excel.

- Live URLs: https://mana-ten.vercel.app · https://build.manasystems.us (SSL resolved Day 11 — HTTP/2 200 via Cloudflare → Vercel)
- GitHub: manasystems/SaaS-Boilerplate (`main` branch)
- Repo origin: ixartz/SaaS-Boilerplate (Stripe + demo code removed)
- Test workspace: "Robertson Civil" (4-member Pro workspace)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (email/password, JWTs, protected routes) |
| Storage | Supabase Storage (`workspace-assets` bucket — logo uploads) |
| Database | Neon Postgres + Drizzle ORM |
| Table grid | TanStack Table v8 |
| PDF export | html2canvas + jsPDF |
| Email | Resend |
| Hosting | Vercel Hobby (GitHub auto-deploy on push to `main`) |
| AI (future) | Claude Sonnet via omnibar — Beta 2+ only |
| Cache (future) | Redis on Upstash — Beta 2+ only |

---

## What's Built (Beta 1 + Beta 1.1 Days 1–3)

### Beta 1 (complete)
- **Auth**: email/password signup/login, protected routes via Supabase
- **Project CRUD**: list, create, rename, delete — all with `user_id` isolation
- **Isolation tests**: 4 tests proving cross-user data access returns zero rows (12/12 passing)
- **Estimate table**: TanStack Table v8, inline editing, Excel-style keyboard nav (Tab/Shift+Tab/Enter/↑↓/Esc), 500ms debounced autosave, add row, delete row on hover
- **Drag-to-reorder** line items via dnd-kit
- **Markup rows**: Overhead/Profit/Contingency % with auto-recalc, grand total
- **PDF export**: html2canvas + jsPDF, clean printable bid with company name + project name
- **Polish**: Empty state, skeleton loaders, global save indicator, breadcrumb nav, tab titles
- **Legal**: `/legal/terms` and `/legal/privacy` static pages; dashboard footer links both
- **Feedback**: Floating button (bottom-left) → mailto link

### Beta 1.1 (complete through Day 3)
- **Rebrand**: "Mana Build" wordmark (Archivo Black), brand tokens in Tailwind, `--brand-orange` CSS var
- **Settings page** (`/dashboard/settings`): 5-tab layout — Profile / Company / Defaults / Appearance / AI
  - **Company tab**: editable company name, address, phone, email — saves on blur via `/api/settings`
  - **Appearance tab**: logo upload (Supabase Storage), live preview, remove button
  - **Defaults tab**: user-configurable Overhead %, Profit %, Contingency % with live $10k preview panel
- **Logo upload**: file picker + preview in Appearance tab; logo stored at `{userId}/company-logo.{ext}` in `workspace-assets` bucket; dashboard header renders uploaded logo
- **Default markups**: saved per-user in `user_profiles`; new estimates seed markup rows from the user's saved defaults (falls back to 10/8/5)

---

## Key Files

```
src/
  features/
    projects/
      queries.ts                   # Project CRUD queries
      ProjectsPanel.tsx            # Project list UI (empty state + skeletons)
      projectIsolation.test.ts     # Isolation tests (12/12 passing)
    estimates/
      EstimateTable.tsx            # Main estimate grid (TanStack Table v8 + dnd-kit)
      SaveStatusContext.tsx        # Save status context + GlobalSaveIndicator
      queries.ts                   # Estimate + line item CRUD queries; ensureDefaultMarkupRows()
    settings/
      LogoUpload.tsx               # Logo file picker, preview, remove (client component)
  app/
    api/
      projects/
        route.ts                   # GET + POST
        [id]/route.ts              # PATCH + DELETE
      estimates/
        route.ts                   # GET + POST
        [id]/line-items/route.ts   # GET + POST line items
        [id]/markup-rows/route.ts  # GET + POST markup rows; fetches user defaults before seeding
      line-items/
        [id]/route.ts              # PATCH + DELETE
      markup-rows/
        [id]/route.ts              # PATCH + DELETE
      settings/
        route.ts                   # GET + PATCH user_profiles (company info + logo + markup defaults)
      upload-logo/
        route.ts                   # POST — upload logo to Supabase Storage; returns public URL
      feedback/
        route.ts                   # POST — save feedback to DB
    dashboard/
      layout.tsx                   # Dashboard layout: footer + feedback button
      page.tsx                     # Projects list + company name field
      CompanyNameField.tsx         # Inline editable company name (client)
      sign-out-button.tsx          # Sign out
      settings/
        page.tsx                   # Settings page — 5-tab UI (Company, Defaults, Appearance, …)
      projects/[projectId]/
        page.tsx                   # Estimate view (server, fetches project + user)
    legal/
      terms/page.tsx               # Terms of Service (public, static)
      privacy/page.tsx             # Privacy Policy (public, static)
  libs/
    DB.ts                          # Database connection (node-postgres / pg)
    Env.ts                         # Env var validation (t3-env)
```

---

## Database Schema (Drizzle)

Tables: `users`, `user_profiles`, `projects`, `estimates`, `line_items`, `markup_rows`, `feedback`

Migrations applied to Neon production: **0000–0006**

| Migration | What it added |
|---|---|
| 0000 | `users`, `projects`, `estimates`, `line_items`, `markup_rows` |
| 0001 | `userId` + timestamps on `estimates` |
| 0002 | `company_name` on `users` |
| 0003 | `feedback` table |
| 0004 | `user_profiles` table (id, user_id, company_name, address, phone, email, updated_at) |
| 0005 | `logo_url`, `accent_color`, `license_number` on `user_profiles` |
| 0006 | `default_overhead`, `default_profit`, `default_contingency` (NUMERIC 6,3) on `user_profiles` |

**`user_profiles` full column set** (as of migration 0006):
`id`, `user_id` (unique FK to Supabase auth UUID), `company_name`, `company_address`, `company_phone`, `company_email`, `logo_url`, `accent_color`, `license_number`, `default_overhead` (default 10), `default_profit` (default 8), `default_contingency` (default 5), `updated_at`

- `users.id` = Supabase auth user UUID
- `user_profiles` is the single source of truth for all per-user settings — upserted via `/api/settings`
- Vertical-specific fields go in a **JSONB `metadata` column** — no vertical logic in core schema columns

---

## Architecture Rules

1. **Every query filters by `user_id`** — RLS is enforced at the app layer, not Supabase RLS (we use Neon, not Supabase Postgres).
2. **AI always shows a diff before writing** — never a direct write to the DB from AI. (Future feature — don't implement direct AI writes.)
3. **PDF generation is client-side only** — html2canvas + jsPDF. No server-side Puppeteer, ever.
4. **Debounce all DB writes on keystroke input** — 500ms debounce minimum.
5. **Vertical-specific fields live in JSONB `metadata` only** — never add vertical-specific columns to core schema tables.
6. **Settings always go through `/api/settings`** — never write to `user_profiles` from any other route except the upsert in `/api/settings/route.ts`.

---

## Commands

```bash
npm run dev                      # local dev server
npm run build                    # production build
npm test                         # run all tests
SKIP_ENV_VALIDATION=1 npx tsc --noEmit   # type-check without needing env vars
npx drizzle-kit generate         # generate migration from schema diff
npx drizzle-kit migrate          # apply pending migrations to Neon
```

---

## Design Language

- **Palette**: Stone/warm-neutral, accent `#C2410C` (burnt orange) — CSS var `--brand-orange`
- **Fonts**: Inter (UI) + JetBrains Mono (numbers/grid) + Archivo Black (wordmark only)
- **Grid**: Dense spreadsheet table, 32px rows
- **UX principle**: Keyboard-first, Excel-like shortcuts. "Don't make them read a manual."

---

## Beta 1 Scope (locked — complete)

1. Deployed web app at real URL ✅
2. Email/password auth with data isolation ✅
3. Create projects + build estimates with line items (qty, unit, unit price) ✅
4. Markup rows (overhead %, fee %, contingency %) with auto-recalc ✅
5. Export clean printable PDF bid ✅
6. Usable by Matt + 2–3 friendly civil estimators on real jobs ✅

Budget ceiling: **$400 for Beta 1**. Current spend: $10.44 (domain only).

---

## Build History — Beta 1.1

### Beta 1.1 Day 1 (2026-04-30) — Rebrand + Settings Scaffold ✅
- Mana Build rebrand: Archivo Black wordmark, `--brand-orange` CSS var wired into Tailwind
- Settings page scaffold at `/dashboard/settings` with 5-tab layout: Profile / Company / Defaults / Appearance / AI
- Company tab fully wired to `/api/settings` (GET + PATCH `user_profiles`)
- `src/app/api/settings/route.ts` created — upserts `user_profiles` row on PATCH

### Beta 1.1 Day 2 (2026-05-02) — Logo Upload ✅
- Supabase Storage bucket `workspace-assets` (private, per-user path: `{userId}/company-logo.{ext}`)
- Migration 0005: `logo_url`, `accent_color`, `license_number` columns added to `user_profiles`
- `src/app/api/upload-logo/route.ts` — upload API with MIME/size validation
- `src/features/settings/LogoUpload.tsx` — file picker, preview, remove
- Settings → Appearance tab live
- Dashboard header renders uploaded logo when set
- `SUPABASE_SERVICE_ROLE_KEY` added to Vercel environment

### Beta 1.1 Day 3 (2026-05-02) — Default Markups ✅
- Migration 0006: `default_overhead`, `default_profit`, `default_contingency` (NUMERIC 6,3, defaults 10/8/5) added to `user_profiles`
- Settings → Defaults tab live: three numeric inputs, Save Defaults button with "Saved ✓" flash, live $10k preview panel (updates in real time as you type)
- `/api/settings` PATCH now validates and saves the three markup defaults
- `ensureDefaultMarkupRows()` updated to accept optional `defaults` param — falls back to 10/8/5
- Markup-rows GET route fetches user's saved defaults from `user_profiles` before seeding — new estimates open with the user's configured rates

---

## Deferred to Beta 2+

- AI omnibar (⌘K) — Claude Sonnet
- Pay-item library
- Takeoff / plan viewer
- Vendor management
- Commercial / residential vertical modes
- Real-time collaboration
- Stripe billing
- Sentry source maps (`SENTRY_AUTH_TOKEN` not set — non-blocking, skip it)
- Redis / Upstash caching
- Profile tab in Settings (currently shell placeholder)
- `accent_color` and `license_number` fields collected in DB but not yet surfaced in UI
