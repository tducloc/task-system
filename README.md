# Task System

Monorepo containing the Task System backend and frontend.

```
task-system/
├── backend/   NestJS 11 + Prisma 7 + PostgreSQL (Auth + Users today)
└── frontend/  React 19 + Vite 8 + TypeScript 6 + Tailwind + shadcn/ui
```

## Stack

**Backend** (`backend/`)
- NestJS 11, Prisma 7, PostgreSQL, JWT (access + rotating refresh tokens)
- Exposes today: `POST /users` (register), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /users/me`, `GET /users/:id`

**Frontend** (`frontend/`)
- React 19 + Vite 8 + TypeScript 6
- Routing: `react-router-dom` v7
- Server state: `@tanstack/react-query`
- Forms: `react-hook-form` + `zod`
- UI: Tailwind CSS v3 + shadcn/ui (`button`, `input`, `label`, `card`, `form`, `sonner`)
- Config lives in `frontend/src/configurations/` (TS files, **no `.env`** on FE)
- API calls go to `/api/*` which the Vite dev server proxies to `http://localhost:3000` — no CORS change needed on BE

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL reachable at the URL you put in `backend/.env`

## First time setup

```bash
# from repo root
pnpm install
```

Create `backend/.env`:

```dotenv
DATABASE_URL="postgresql://user:password@localhost:5432/task_system"
JWT_SECRET="some-long-random-string"
JWT_REFRESH_SECRET="another-long-random-string"
# PORT=3000   # optional, defaults to 3000
```

Apply migrations:

```bash
pnpm --filter backend exec prisma migrate deploy
# or, for local dev:
pnpm --filter backend exec prisma migrate dev
```

## Local development

Run the backend and frontend in two terminals:

```bash
# terminal 1 — backend on http://localhost:3000
pnpm dev:be

# terminal 2 — frontend on http://localhost:5173
pnpm dev:fe
```

Open http://localhost:5173 in a browser. The FE proxies `/api/*` to the BE.

## Other scripts (run from repo root)

```bash
pnpm build       # builds both packages
pnpm lint        # lints both packages
```

To run a script in only one package, use `pnpm --filter <pkg>`:

```bash
pnpm --filter backend run start:debug
pnpm --filter frontend run preview
```

## Smoke test checklist

Once both servers are running, exercise these flows in the browser to verify everything is wired up:

1. Open `http://localhost:5173/` — should redirect to `/login`.
2. Click "Đăng ký" → fill `test@example.com` / `password123` → submit. Expect toast "Đăng ký thành công" and redirect to `/login`.
3. On `/login`, sign in with those credentials. Expect redirect to `/me` showing the user's id, email, and timestamps.
4. Open DevTools → Application → Local Storage. Expect `ts_access` and `ts_refresh` populated.
5. Delete `ts_access` only and reload `/me`. The api-client should silently refresh and the page should load. Verify `ts_access` is repopulated.
6. Delete both tokens and reload `/me`. Expect redirect to `/login`.
7. Click "Đăng xuất". Expect tokens cleared from localStorage and redirect to `/login`.
8. Try logging in with a wrong password. Expect toast "Email hoặc mật khẩu không đúng".
9. Try registering an existing email. Expect inline error on the email field: "Email already exists".
10. Visit `/users/00000000-0000-0000-0000-000000000000`. Expect in-page "Không tìm thấy user với id…" (not a toast).

## Layout

See `docs/superpowers/specs/2026-05-12-monorepo-fe-design.md` for the design and `docs/superpowers/plans/2026-05-12-monorepo-fe-scaffold.md` for the implementation plan.
