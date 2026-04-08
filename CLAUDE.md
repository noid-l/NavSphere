# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Next.js with Turbopack)
pnpm build        # Production build (uses --webpack flag)
pnpm typecheck    # TypeScript type check (tsc --noEmit)
```

No test framework is configured. There is a `pnpm bookmarks:export` script for Chrome bookmarks conversion.

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + Supabase + Tailwind CSS v4

### Data Flow

- **Public pages**: Server components call `getNavigationSnapshot()` from `lib/data/navigation.ts`, which queries Supabase and returns a `NavigationSnapshot` typed object. No client-side data fetching on the home page.
- **Admin pages**: Server components fetch initial data via `lib/data/admin.ts` functions, then hydrate `"use client"` manager components (e.g. `AdminCategoriesManager`, `AdminLinksManager`). Client components call `/api/admin/*` routes for mutations, then call `router.refresh()` to re-render server components.
- **Auth flow**: GitHub OAuth via Supabase Auth → callback at `/auth/callback` → session stored in cookies via `@supabase/ssr`. Server-side auth helpers in `lib/supabase/auth.ts` (`getOptionalCurrentUser`, `getRequiredCurrentUser`).

### Key Modules

- `lib/supabase/server.ts` — Server-side Supabase client creation (reads cookies for session)
- `lib/supabase/auth.ts` — Auth helpers used in server components and layouts
- `lib/env.ts` — Validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `lib/types.ts` — Core domain types: `Category`, `NavLink`, `NavigationSnapshot`, `AdminCategoryItem`, `AdminLinkItem`, `LinkEnv`
- `lib/data/admin.ts` — All admin data access functions; mutations go through API routes, not direct DB writes from server components

### API Routes (`app/api/`)

- `admin/categories/` and `admin/links/` — CRUD operations with RLS-enforced ownership (`created_by = auth.uid()`)
- `admin/categories/reorder` and `admin/links/reorder` — Batch reorder endpoints
- `import/` — JSON data import (idempotent by user + category name + link name)

### Database

Schema is in `supabase/schema.sql`. Two main tables: `categories` and `links`. Both have `created_by` (FK to auth.users) with RLS policies ensuring users only see/manage their own data. Categories use path-style names (e.g. "研发 / AI工具") for sidebar grouping display only — no real tree structure.

### Styling

- Tailwind CSS v4 with `@theme` directive in `app/globals.css`
- CSS variables for colors (`--bg`, `--surface`, `--ink`, `--accent`, etc.) and design tokens
- Font: Outfit (loaded via `next/font/google`)
- Admin pages use dark sidebar (`#13131a`) with context-aware nav styling via CSS descendant selectors (`.admin-nav-link` / `.admin-nav-active` classes styled differently inside `aside` vs `header`)
- Custom animations defined in globals.css: `card-enter`, `admin-card-enter`, `slide-in-right`, `fade-in`

### Component Patterns

- Server components for data fetching (all `page.tsx` and `layout.tsx` files)
- `"use client"` components for interactivity: drag-and-drop sorting, form state, real-time filtering
- Side panel pattern: `isSheetOpen` state renders a fixed overlay with form (categories and links managers)
- Admin sidebar nav uses `useTransition` for navigation with pending state indicators

## Environment Setup

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<project_url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon_key>
```

Supabase needs: GitHub OAuth enabled, callback URL set to `/auth/callback`, schema from `supabase/schema.sql` applied.
