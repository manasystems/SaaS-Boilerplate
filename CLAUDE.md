# Mana — Construction Estimating SaaS

## Project Overview

Mana is a web-based construction estimating SaaS. Tagline: "a better Excel for construction estimating, with an AI command bar, that produces professional bids — tuned to your vertical."

Beachhead market: small-to-mid civil contractors (sitework subs, paving contractors, utility contractors) under $20M revenue who are stuck in Excel.

- Live URL: https://mana-ten.vercel.app (build.manasystems.us SSL pending)
- GitHub: manasystems/SaaS-Boilerplate (`main` branch)
- Repo origin: ixartz/SaaS-Boilerplate (Stripe + demo code removed)
- Test workspace: "Robertson Civil" (4-member Pro workspace)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (email/password, JWTs, protected routes) |
| Database | Neon Postgres + Drizzle ORM |
| Table grid | TanStack Table v8 (Days 6–7) |
| PDF export | html2canvas + jsPDF (Day 9) |
| Email | Resend |
| Hosting | Vercel Hobby (GitHub auto-deploy on push to `main`) |
| AI (future) | Claude Sonnet via omnibar — Beta 2+ only |
| Cache (future) | Redis on Upstash — Beta 2+ only |

---

## What's Built (Days 1–11 complete)

- **Auth**: email/password signup/login, protected routes via Supabase
- **Database**: Neon Postgres wired, Drizzle schema + migrations applied
- **Project CRUD**: list, create, rename, delete — all with `user_id` isolation
- **Isolation tests**: 4 tests proving cross-user data access returns zero rows (12/12 passing)
- **Deployed**: Vercel with GitHub auto-deploy on push to `main`
- **Estimate table** (Day 6): TanStack Table v8, inline editing, Excel-style keyboard nav (Tab/Shift+Tab/Enter/↑↓/Esc), 500ms debounced autosave, add row, delete row on hover
- **Drag-to-reorder** line items via dnd-kit
- **Markup rows**: overhead/fee/contingency % with auto-recalc, grand total
- **PDF export**: html2canvas + jsPDF, clean printable bid with company name + project name
- **API routes**: `/api/estimates`, `/api/estimates/[id]/line-items`, `/api/estimates/[id]/markup-rows`, `/api/line-items/[id]`, `/api/markup-rows/[id]`, `/api/projects`, `/api/projects/[id]`, `/api/user-settings`
- **Schema**: `users`, `projects`, `estimates`, `line_items`, `markup_rows` — migrations 0000–0002 applied
- **Polish (Day 10)**:
  - Empty state for projects list (icon + CTA button)
  - Animated skeleton cards while projects load
  - Global save indicator (fixed bottom-right: Saving/Saved/Error)
  - Company name per user — editable in dashboard header, shown in PDF export
  - Dashboard tab title "Projects | Mana", project page "[Name] | Mana"
  - Mana wordmark in header (burnt orange), Construction Estimating tagline
  - Breadcrumb ← Projects on estimate page
- **Legal + Feedback (Day 11)**:
  - `/terms` and `/privacy` static pages — SaaS-appropriate boilerplate
  - Dashboard footer linking to both pages on all dashboard routes
  - Floating "Feedback" button (bottom-left) — modal with textarea, posts to `/api/feedback`
  - `feedback` table in Neon (migration 0003 applied) — stores userId, message, created_at

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
      queries.ts                   # Estimate + line item CRUD queries
    feedback/
      FeedbackButton.tsx           # Floating feedback button + modal (client)
  app/
    api/
      projects/
        route.ts                   # GET + POST
        [id]/route.ts              # PATCH + DELETE
      estimates/
        route.ts                   # GET + POST
        [id]/line-items/route.ts   # GET + POST line items
        [id]/markup-rows/route.ts  # GET + POST markup rows
      line-items/
        [id]/route.ts              # PATCH + DELETE
      markup-rows/
        [id]/route.ts              # PATCH + DELETE
      user-settings/
        route.ts                   # GET + PATCH company name
      feedback/
        route.ts                   # POST — save feedback to DB
    dashboard/
      layout.tsx                   # Dashboard layout: footer + feedback button
      page.tsx                     # Projects list + company name field
      CompanyNameField.tsx         # Inline editable company name (client)
      sign-out-button.tsx          # Sign out
      projects/[projectId]/
        page.tsx                   # Estimate view (server, fetches project + user)
    terms/
      page.tsx                     # Terms of Service (public, static)
    privacy/
      page.tsx                     # Privacy Policy (public, static)
  libs/
    DB.ts                          # Database connection (node-postgres / pg)
    Env.ts                         # Env var validation (t3-env)
```

---

## Database Schema (Drizzle)

Tables: `users`, `projects`, `estimates`, `line_items`, `markup_rows`, `feedback`

- `users.id` = Supabase auth user UUID; stores `company_name`
- Vertical-specific fields go in a **JSONB `metadata` column** — no vertical logic in core schema columns.

---

## Architecture Rules

1. **Every query filters by `user_id`** — RLS is enforced at the app layer, not Supabase RLS (we use Neon, not Supabase Postgres).
2. **AI always shows a diff before writing** — never a direct write to the DB from AI. (Future feature — don't implement direct AI writes.)
3. **PDF generation is client-side only** — html2canvas + jsPDF. No server-side Puppeteer, ever.
4. **Debounce all DB writes on keystroke input** — 500ms debounce minimum.
5. **Vertical-specific fields live in JSONB `metadata` only** — never add vertical-specific columns to core schema tables.

---

## Commands

```bash
npm run dev               # local dev server
npm run build             # production build
npm test                  # run all tests
npx drizzle-kit migrate   # run migrations
vercel deploy --token=<token>   # deploy to Vercel
```

---

## Design Language

- **Palette**: Stone/warm-neutral, accent `#C2410C` (burnt orange)
- **Fonts**: Inter (UI) + JetBrains Mono (numbers/grid)
- **Grid**: Dense spreadsheet table, 32px rows
- **UX principle**: Keyboard-first, Excel-like shortcuts. "Don't make them read a manual."

---

## Beta 1 Scope (locked — do not add features outside this list)

1. Deployed web app at real URL ✅
2. Email/password auth with data isolation ✅
3. Create projects + build estimates with line items (qty, unit, unit price) ✅
4. Markup rows (overhead %, fee %, contingency %) with auto-recalc ✅
5. Export clean printable PDF bid ✅
6. Usable by Matt + 2–3 friendly civil estimators on real jobs ✅

Budget ceiling: **$400 for Beta 1**. Current spend: $10.44 (domain only).

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
