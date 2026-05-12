# Monorepo Conversion + Frontend Scaffold — Design

**Date:** 2026-05-12
**Status:** Approved (sections), pending final spec review
**Authors:** AI (FE), user (BE)

## 1. Goal

Convert the existing single-package NestJS project at `task-system/` into a pnpm-workspace monorepo containing two packages — `backend/` (the existing API, structurally unchanged) and `frontend/` (a new React + Vite + TypeScript app) — and implement frontend features that mirror the endpoints the backend already exposes.

The longer-term split of responsibilities: the user develops the backend; the AI develops the frontend. The design favours decisions that make this split easy to sustain (clear package boundary, no implicit type sharing, conventional FE structure, no BE modifications required for the FE to function in development).

## 2. Constraints

- **BE must not change** during this work. No CORS edit, no port change, no controller change. The FE adapts.
- BE keeps its current folder structure (`src/`, `prisma/`, `test/`, configs); it is simply moved as a unit into `backend/`.
- FE must run against the BE on `localhost:3000` in development without cross-origin errors.
- **No `.env` files on FE.** Configuration lives in `src/configurations/` TS files (see [[feedback-fe-config-pattern]]).
- Scope is limited to features the BE already exposes today. Task / Workspace / Membership models exist in Prisma but have no controllers and therefore are **not** implemented on FE.

## 3. Repository Layout

```
task-system/
├── backend/                  ← existing NestJS, moved as-is
│   ├── src/
│   ├── prisma/
│   ├── test/
│   ├── package.json          (name: "backend")
│   ├── tsconfig.json, tsconfig.build.json
│   ├── nest-cli.json, prisma.config.ts, eslint.config.mjs, .prettierrc
│   └── .env                  (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT?)
├── frontend/                 ← new React + Vite + TS app
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js, postcss.config.js
│   ├── components.json       (shadcn config)
│   ├── tsconfig.json, tsconfig.node.json
│   └── package.json          (name: "frontend")
├── pnpm-workspace.yaml       (workspaces: ["backend", "frontend"])
├── package.json              (root monorepo manifest, scripts orchestration)
├── pnpm-lock.yaml            (regenerated)
├── .gitignore
├── README.md
└── docs/
```

The flat `backend/` + `frontend/` choice (rather than `apps/api` + `apps/web`) was made by the user. There is no `packages/shared` — see §7 for the type-sharing rationale.

## 4. Backend Package

The BE is moved unchanged. All paths inside (e.g., `@/database/prisma.service`) continue to work because the `tsconfig.json` and `nest-cli.json` move with it. The existing scripts (`start:dev`, `build`, `test`) become the package's scripts, invoked through pnpm workspace filtering from root.

The BE `.env` file moves from repo root to `backend/.env` (Nest's `dotenv/config` import resolves relative to CWD = `backend/`).

## 5. Frontend Package

### 5.1 Tech stack

| Concern | Choice |
|---|---|
| Build/dev | Vite 5, React 18, TypeScript 5 |
| Routing | `react-router-dom` v6 |
| Server state | `@tanstack/react-query` |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` + `zod` |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui (button, input, label, card, form, sonner) |
| Icons | `lucide-react` |

### 5.2 Source layout

```
frontend/src/
├── main.tsx                    React entry, mounts providers
├── App.tsx                     Router + providers composition
├── index.css                   Tailwind directives + shadcn CSS vars
├── routes.tsx                  Route table
│
├── configurations/
│   ├── index.ts                Picks & merges config based on Vite build mode
│   ├── base.ts                 Defaults (apiBaseUrl, auth keys, query options)
│   ├── dev.ts                  Dev overrides (currently none)
│   └── prod.ts                 Prod overrides (real API URL when deploying)
│
├── lib/
│   ├── api-client.ts           fetch wrapper, auth header, 401→refresh→retry
│   ├── auth-storage.ts         localStorage get/set/clear for tokens
│   ├── query-client.ts         TanStack QueryClient singleton
│   └── utils.ts                shadcn cn() helper
│
├── features/
│   ├── auth/
│   │   ├── api.ts              login, register, logout, refresh mutations
│   │   ├── schemas.ts          Zod schemas (LoginSchema, RegisterSchema)
│   │   ├── types.ts            LoginResponse, AuthTokens
│   │   ├── use-auth.ts         isAuthenticated, logout()
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ProtectedRoute.tsx  redirect to /login if no access token
│   └── users/
│       ├── api.ts              getMe, getUserById queries
│       ├── types.ts            User (id, email, createdAt, updatedAt)
│       ├── MePage.tsx
│       └── UserDetailPage.tsx
│
└── components/
    ├── ui/                     shadcn primitives
    └── layout/
        ├── AppLayout.tsx       Header + <Outlet />
        └── Header.tsx          Logo, /me link, logout button
```

### 5.3 Routes

| Path | Page | Auth | BE call |
|---|---|---|---|
| `/login` | LoginPage | public | `POST /auth/login` |
| `/register` | RegisterPage | public | `POST /users` |
| `/me` | MePage | protected | `GET /users/me` |
| `/users/:id` | UserDetailPage | protected | `GET /users/:id` |
| `/` | redirect | — | → `/me` if access token, else `/login` |
| `*` | NotFound | — | — |

## 6. Configuration Pattern

No `.env` files on the FE side. Configuration is TypeScript code under `src/configurations/`:

```ts
// base.ts
export const baseConfig = {
  apiBaseUrl: '/api',
  authStorage: { accessKey: 'ts_access', refreshKey: 'ts_refresh' },
  query: { staleTime: 30_000, retry: 1 },
};

// dev.ts
export const devConfig: Partial<typeof baseConfig> = {};

// prod.ts
export const prodConfig: Partial<typeof baseConfig> = {
  apiBaseUrl: 'https://api.example.com', // replaced when deploying
};

// index.ts
import { baseConfig } from './base';
import { devConfig } from './dev';
import { prodConfig } from './prod';

const overrides = import.meta.env.PROD ? prodConfig : devConfig;
export const config = { ...baseConfig, ...overrides };
export type Config = typeof baseConfig;
```

`import.meta.env.PROD` and `import.meta.env.MODE` are Vite build-time constants, not `.env` values; their use is consistent with the "no env" preference because the values are inlined at compile time and unused branches are dead-code-eliminated.

Adding a new environment (e.g., staging) is: create `staging.ts`, extend the picker in `index.ts` (`MODE === 'staging' ? stagingConfig : ...`). No `.env` introduction.

## 7. Type Sharing

There is no shared package. FE re-declares the response shapes it consumes in `features/*/types.ts`. The shapes are small and stable:

```ts
// features/users/types.ts
export type User = { id: string; email: string; createdAt: string; updatedAt: string };
// features/auth/types.ts
export type AuthTokens = { accessToken: string; refreshToken: string };
```

Trade-off acknowledged: if BE changes a response shape, FE has to update by hand. Accepted because (a) the surface is small, (b) the working split is user-on-BE / AI-on-FE — when BE shifts shape, AI will read BE source and update FE types, which is a routine operation.

## 8. API Client & Auth

### 8.1 Token storage

`lib/auth-storage.ts` exposes `getAccess()`, `getRefresh()`, `setTokens({accessToken, refreshToken})`, `clear()`. Keys are pulled from `config.authStorage` (`ts_access`, `ts_refresh`). localStorage was chosen because the BE returns tokens in the response body — switching to httpOnly cookies would require BE changes, which are out of scope.

### 8.2 Request flow

`lib/api-client.ts` exports a single `request(path, options)` function and convenience helpers (`get`, `post`). Behaviour:

1. Prepend `config.apiBaseUrl` (default `/api`).
2. Attach `Authorization: Bearer <accessToken>` if present.
3. Parse JSON. Throw `ApiError { status, message, body }` if `!response.ok`.
4. On status `401`, with a refresh token available and the request not already a retry: await `refreshOnce()`, then retry the original request once with the new access token.
5. If `refreshOnce()` fails: clear storage, redirect to `/login`, throw.

### 8.3 Concurrent 401 handling

```ts
let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshOnce(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
```

When N requests receive 401 concurrently, the first creates `refreshPromise`; the others see the existing promise and `await` it. Only one `POST /auth/refresh` is issued. Each request then retries with the new access token (read from storage in the original `request` call's retry path). This is functionally equivalent to an explicit queue but uses promise-sharing instead of a manual queue structure.

This shape is required by the BE: the refresh endpoint is rotating (deletes old refresh token, issues new one in a transaction). Two concurrent refresh calls with the same token would race — the second would see the old token already gone and fail. Promise-sharing makes that impossible.

Edge cases handled:

- Refresh itself returns 401 → clear storage, redirect, reject queued awaiters.
- Original request was itself `/auth/refresh` → no recursive refresh; failure → logout flow.
- A `_retried` flag in `request()` ensures at most one retry per original call (no infinite loop if the new access token also 401s).

### 8.4 TanStack Query

`QueryClient` is created from `config.query` defaults. Mutations: `useLoginMutation`, `useRegisterMutation`, `useLogoutMutation`. Queries: `useMeQuery()`, `useUserQuery(id)`. On login success: `queryClient.invalidateQueries()`. On logout: `queryClient.clear()`.

Retry is disabled for 401 specifically (the api-client already handles refresh transparently; TanStack Query retries would be redundant noise).

## 9. Feature Behaviour

### 9.1 Register

Form fields: `email` (Zod email), `password` (Zod min length 6). Submit → `POST /users`. Success: toast "Đăng ký thành công", navigate to `/login`. BE error `400 Email already exists` is mapped onto the `email` field.

### 9.2 Login

Form fields: `email`, `password`. Submit → `POST /auth/login`. Success: store `{accessToken, refreshToken}`, navigate to `/me`. BE `401` → toast "Email hoặc mật khẩu không đúng".

### 9.3 Logout

Header button. `POST /auth/logout` with the current refresh token. **Local cleanup runs regardless of BE response** — if the BE call fails (e.g., token already revoked, network), localStorage is still cleared and the user is still redirected to `/login`. This prevents a user from being stuck "logged in" on the client when the server has already invalidated them.

After cleanup: `queryClient.clear()`, navigate to `/login`.

### 9.4 Profile (`/me`)

`useMeQuery()` → `GET /users/me`. Displays email, id, createdAt. Loading: spinner. Error 401 is invisible (handled by api-client refresh path). Any other error → inline error card.

### 9.5 User detail (`/users/:id`)

`useUserQuery(id)` → `GET /users/:id`. Same loading/error pattern as `/me`. BE `404` is shown as an in-page empty state ("User not found"), not a toast.

## 10. Protected Routes

```tsx
function ProtectedRoute() {
  return getAccess() ? <Outlet /> : <Navigate to="/login" replace />;
}
```

The check is naive (presence of an access token, not validity). If the token has expired, the first protected API call returns 401, api-client refreshes transparently, and the user proceeds without noticing. If the refresh token has also expired, api-client clears storage and redirects to `/login`.

## 11. Dev Server & Proxy

`vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
```

The proxy is why no CORS change is needed on the BE: from the browser's perspective, requests go to `http://localhost:5173/api/...`; Vite forwards them to `http://localhost:3000/...`.

## 12. Error UX

| Source | UX |
|---|---|
| Zod / RHF validation | Inline message under the field |
| BE 4xx with field-mappable message | Inline on field (e.g., "Email already exists" → email field) |
| BE 4xx generic | `sonner` toast with the BE message |
| BE 5xx / network | `sonner` toast "Có lỗi xảy ra, thử lại sau" |
| 404 on user detail | In-page empty state, no toast |
| Auth refresh failure | Silent: clear storage, redirect to `/login` |

## 13. Root Workspace

`pnpm-workspace.yaml`:

```yaml
packages:
  - backend
  - frontend
```

Root `package.json` (sketch):

```jsonc
{
  "name": "task-system",
  "private": true,
  "scripts": {
    "dev":    "pnpm -r --parallel run dev",
    "dev:be": "pnpm --filter backend start:dev",
    "dev:fe": "pnpm --filter frontend dev",
    "build":  "pnpm -r run build",
    "lint":   "pnpm -r run lint"
  }
}
```

The BE's current `start:dev` script stays where it is (in `backend/package.json`); the root just forwards. The FE will expose `dev`, `build`, `preview`, `lint` (Vite defaults plus ESLint).

## 14. Out of Scope

- Docker / docker-compose
- CI/CD pipelines
- Production build/deploy setup
- Internationalization (UI strings are Vietnamese inline, English-OK fallback acceptable)
- Dark mode
- Automated tests (no test framework added on FE; BE keeps Jest as-is)
- Pre-commit hooks
- Any BE modification (CORS, password-stripping, controller additions)
- Implementing features for Task / Workspace / Membership (not exposed by BE yet)
- Type-generation from Prisma or OpenAPI

## 15. Risks & Open Questions

- **Lock file regeneration:** moving `package.json` into `backend/` will invalidate the root `pnpm-lock.yaml`. The first `pnpm install` after the move regenerates it. Lock churn is expected and acceptable.
- **BE `.env` location:** if the user has scripts or tooling that assume `.env` at the repo root, the move to `backend/.env` will break them. To be confirmed at implementation time; can be mitigated by a root symlink if needed.
- **Auto-refresh on app boot:** on initial page load, the FE has only the (possibly expired) access token in localStorage. The first request will 401 and trigger refresh — invisible if the refresh token is still valid. No explicit "warm-up refresh on boot" is implemented.
- **Type drift:** FE types are hand-written. When BE response shape changes, FE will not get a compile error; the bug surfaces at runtime. The user/AI split (BE-by-user / FE-by-AI) means this is detectable on FE work, but worth flagging.

## 16. Acceptance Criteria

1. `pnpm install` at repo root succeeds.
2. `pnpm dev:be` starts the BE on port 3000 with no source changes from the pre-monorepo state.
3. `pnpm dev:fe` starts the FE on port 5173.
4. Manual smoke test: register a new user via FE → log in via FE → land on `/me` showing the user's email → click logout → land on `/login`.
5. With a deliberately expired access token in localStorage and a valid refresh token, navigating to `/me` succeeds (refresh happens transparently).
6. With both tokens cleared, navigating to `/me` redirects to `/login`.
7. No `.env` file exists under `frontend/`. The string "VITE_" appears nowhere in `frontend/src/`.
8. BE source files (anything under `backend/src/`, `backend/prisma/`) are byte-identical to their pre-move counterparts except for path moves.
