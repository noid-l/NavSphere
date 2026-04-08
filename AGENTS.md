# Repository Guidelines

## Project Structure & Module Organization

This repository is a Next.js App Router project. Keep route files in `app/`, including the public home page, `/login`, `/admin`, and API routes under `app/api/`. Reusable UI lives in `components/`, with admin-specific components in `components/admin/` and homepage sections in `components/sections/`. Data access and Supabase helpers belong in `lib/data/` and `lib/supabase/`. Example import payloads are in `data/`, one-off local scripts go in `scripts/`, and database schema changes must be reflected in `supabase/schema.sql`.

## Build, Test, and Development Commands

- `npm install`: install project dependencies.
- `npm run dev`: start the local development server at `http://localhost:3000`.
- `npm run build`: create a production build.
- `npm run start`: run the production build locally.
- `npm run typecheck`: run `tsc --noEmit`; this is the main validation step today.
- `npm run bookmarks:export`: convert local Chrome bookmarks into NavSphere import JSON.

## Coding Style & Naming Conventions

Use TypeScript for application code. Follow the existing file style in the area you edit, but default to 2-space indentation, clear prop names, and small focused functions. Use `PascalCase` for React components, `camelCase` for functions and variables, and `kebab-case` for component filenames such as `admin-links-manager.tsx`. Hook files should start with `use-`, for example `use-debounced-value.ts`. Prefer server components in `app/` unless client interactivity is required.

## Testing Guidelines

There is no dedicated unit test suite yet. For every change, run `npm run typecheck` and perform the smallest relevant manual check in the browser. For route or auth changes, verify login, `/admin`, and import flows. If you add tests later, place them next to the feature or under a dedicated `tests/` directory and use descriptive names like `navigation-shell.test.tsx`.

## Commit & Pull Request Guidelines

Recent history includes generic messages like `update`, but contributors should use specific, imperative commits such as `feat: add category reorder API` or `fix: handle missing Supabase env`. Keep pull requests small and focused. Include a short summary, affected paths, validation steps, linked issues, and screenshots for UI changes.

## Security & Configuration Tips

Do not commit `.env.local` or Supabase secrets. Keep local config aligned with `.env.example`, and document any new environment variables in both `README.md` and this guide when relevant.
