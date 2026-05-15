---
globs: frontend/**/*
---

# Clean Code Rules

## When to Activate

Apply when writing or reviewing code in the frontend repo (`frontend/**/src/`).

## Code Quality Principles

### 1. Readability First

- Code is read more than written — optimize for the reader
- Clear variable and function names over clever one-liners
- Self-documenting code preferred over comments

### 2. KISS (Keep It Simple, Stupid)

- Simplest solution that works
- Avoid over-engineering
- No premature optimization
- Easy to understand > clever code

### 3. DRY (Don't Repeat Yourself)

- Extract common logic into functions
- Create reusable components in `components/Common/`
- Share utilities across modules via `utils/` and `hooks/`
- DRY is subordinate to readability. Don't extract until the third occurrence (see Code Reuse below). A premature abstraction is worse than a little duplication.

### 4. YAGNI (You Aren't Gonna Need It)

- Don't build features before they're needed
- Avoid speculative generality
- Add complexity only when required

## Imports

- Use absolute imports from `src/` (configured via tsconfig paths), never relative `../../`
- Group imports: external libs → components → constants/types → utils/hooks → assets
- Remove unused imports before committing (lint catches this, but don't ignore it)

## Readability

### Early returns over nesting

Prefer early returns to reduce nesting:

- **Same return value** → combine into one compound guard with `||`
- **Different return values** → separate early returns, one per check
- Flip `if (x) { ...long... } else { ...short... }` to `if (!x) { ...short; return; }` to keep the main logic at top-level

```typescript
// GOOD
if (!user || !user.isAdmin || !market.isActive) {
  return;
}
// main logic at top level

// BAD — nested
if (user) {
  if (user.isAdmin) {
    if (market.isActive) {
      // buried logic
    }
  }
}
```

### Magic numbers

Extract unexplained numbers into named constants (`MAX_RETRIES = 3`, `DEBOUNCE_DELAY_MS = 500`).

### Group related code

ALWAYS group related code together, separated by a blank line — each group should represent one logical unit.

### Positive conditionals

Avoid negative conditionals — `if (isLoggedIn)` not `if (!isNotLoggedIn)`.

### Always use braces

NEVER use single-line `if` without braces. Always wrap the body in braces, even for single statements like `return`, `break`, `continue`, `throw`, or any one-liner.

### Declare variables close to usage

Declare variables close to where they're used, not at the top of the function.

### No flag arguments

Avoid flag arguments — `renderCard(item, true, false)` is unreadable. Split into separate functions or use an options object.

## Functions

- Keep individual functions and callbacks under ~50 lines. If a `useCallback` has a switch with 5+ cases, extract each case into a named function.
- If a function inside a component doesn't reference hooks, state, or props, extract it as a module-level pure function. Pure functions are easier to test and don't need `useCallback`.
- Prefer named handlers over inline lambdas in JSX. Extract multi-statement handlers into a `handle`-prefixed function:

```typescript
// BAD — inline logic in JSX
<button onClick={() => { setItems(prev => prev.filter(i => i.id !== item.id)); toast('Deleted'); }}>

// GOOD — named handler
const handleDelete = (id: number) => {
  setItems((prev) => prev.filter((i) => i.id !== id));
  toast('Deleted');
};
<button onClick={() => handleDelete(item.id)}>
```

## Components

- One component per file. If a helper component is only used in one file, define it in the same file — below the main component, above `export default`.
- Keep components under 200 lines. If larger, split into sub-components.
- No inline styles unless the value is truly dynamic (computed at runtime, e.g., `style={{ width: `${percentage}%` }}`). Use Tailwind classes or styled-components instead.
- Use `React.memo` only when a component re-renders often with the same props and rendering is measurably expensive. Don't wrap every component — the overhead of shallow comparison can outweigh the savings for cheap renders.
- Use `React.lazy` and `Suspense` for route-level code splitting. Don't lazy-load small components — the overhead isn't worth it.

## TypeScript

### No `any`

Use `unknown` with type narrowing if the type is genuinely unknown. Never use `any` in function signatures or variable declarations.

### No type assertions (`as`)

Unless interfacing with untyped external code, narrowing an untyped API response field where a type guard would be excessive, or narrowing inside a discriminated event dispatch (e.g., `switch` on event type then `data as SSEInitEvent`).

### Interface over type

Prefer `interface` for object shapes that may be extended (props, API responses). Use `type` for unions, intersections, and computed/mapped types.

### Prefix frontend-local fields with `_`

When adding frontend-local/computed fields to a backend response type, prefix those fields with `_` to make them clearly non-API fields.

### Use enums for named string/number sets

Extract fixed literal sets into `enum` instead of inlining (e.g., `enum RateLimitWindow { HOURLY = 'hourly', DAILY = 'daily' }`). Exception: single-use discriminants local to one type may remain as literals.

### Immutability

Use spread (`{ ...obj, key: val }`, `[...arr, item]`) instead of direct mutation. Exception: direct mutation is expected inside Immer `produce()` draft callbacks.

## State & Effects

- No unnecessary state. If a value can be derived from existing state/props, compute it inline (a plain `const`). Only reach for `useMemo` when the computation is expensive — inline is the default, `useMemo` is the exception.
- No unnecessary memoization. Only use `useMemo` when the computation is expensive or the value is passed to a `React.memo` child. Only use `useCallback` when the function is passed to a memoized child or appears in a dependency array. A plain `const` or inline function is fine otherwise.
- Every `useEffect` must have a clear purpose. If you can't name it in 5 words, it's doing too much — split it.
- Clean up subscriptions/timers in useEffect return.
- List all referenced values in `useCallback`/`useMemo`/`useEffect` deps. Don't suppress `react-hooks/exhaustive-deps` warnings without a comment explaining why.

### Functional state updates

Use `setCount((prev) => prev + 1)` not `setCount(count + 1)` — direct references can be stale in async/batched scenarios.

### Conditional rendering

- Use separate `{condition && <Component />}` blocks, not nested ternaries
- **Falsy-render gotcha**: `{count && <X />}` renders `"0"` when count is 0. Use `{!!count && <X />}` or `{Boolean(count) && <X />}`
- **Multiple branches**: for 3+ states, use a lookup object or extract a variable instead of chained ternaries:

```typescript
// GOOD — lookup object
const statusContent: Record<Status, ReactNode> = {
  loading: <Spinner />,
  error: <ErrorBanner />,
  empty: <EmptyState />,
  ready: <DataTable />,
};
return statusContent[status];
```

- **Key on conditional swaps**: use `key` to force remount when swapping between components that share the same position: `{isEditing ? <Editor key="editor" /> : <Viewer key="viewer" />}`

## Async/Await

Use `Promise.all()` for independent async operations. Don't `await` sequentially when calls don't depend on each other.

## Naming

- **Variables**: descriptive names (`marketSearchQuery`, not `q`; `isUserAuthenticated`, not `flag`)
- **Functions**: verb-noun pattern (`fetchMarketData`, `calculateSimilarity`, `isValidEmail`)

### Conventions

- Boolean variables/props: prefix with `is`, `has`, `should`, `can`
  (e.g., `isLoading`, `hasError`)
- Event handlers inside components: prefix with `handle` (e.g., `handleClick`, `handleSort`)
- Callback props passed to components: prefix with `on` (e.g., `onChange`, `onSelect`, `onClose`). Use present tense consistently — this matches React's own APIs and third-party libraries.
- Avoid abbreviations except well-known ones (e.g., `ctx` for context, `ref` for reference)
- Naming implies purity — a function prefixed with `get`, `is`, `has`, or `compute` should not modify state. Side effects belong in `handle`/`set`/`update`-prefixed functions.

## Tailwind

- Order classes consistently: layout (flex, grid, position) → sizing (w, h) → spacing (p, m, gap) → typography (text, font) → colors (bg, text, border) → effects (shadow, opacity, transition). If `prettier-plugin-tailwindcss` is configured, it handles this automatically.

## Error Handling

- Every async operation (API call, data fetch) needs loading, error, and empty state handling — not just the happy path. A component that fetches data should always show something meaningful when the request is in-flight, fails, or returns nothing.
- Don't wrap internal/synchronous code in try/catch. Only catch at boundaries: API calls, user input parsing, third-party libs. A caught-and-swallowed error is worse than a crash — crashes are visible, silent failures aren't.

## React-Use & Lodash First

Before writing a custom hook or utility function, check whether `react-use` or `lodash` already provides it. These libraries are battle-tested, edge-case-handled, and well-documented — a custom implementation is almost always worse.

- **Hooks**: check `react-use` before writing custom (`useDebounce`, `useLocalStorage`, `usePrevious`, `useToggle`, `useClickAway`, etc.)
- **Utilities**: check `lodash-es` (tree-shakeable) before writing custom (`groupBy`, `debounce`, `cloneDeep`, `isEqual`, `pick`, `omit`, etc.)
- **Write custom only when**: the library doesn't cover the use case, or you need tight integration with project-specific state/context

## Code Reuse & Duplication

- **Reuse shared utilities, not old feature code.** Check `src/components/Common/`, `src/utils/`, and `src/hooks/` for genuinely shared code to reuse. But do NOT reuse types, services, or components from an old/replaced feature when the backend schema or data model has changed — write fresh code that matches the new contract. Forcing old code to fit a new schema creates adapter layers, type gymnastics, and code that's harder to read than starting clean.
- **When to reuse vs. rewrite:**
  - **Reuse**: shared UI components (`Common/`), generic utils, hooks that don't depend on a specific data shape
  - **Rewrite**: types, services, and feature components when the API contract or data model has changed. Even if the UI looks similar, if the underlying data is different, build from the new schema up — don't wrap or adapt old types.
- **Rule of Three**: if you write similar logic a third time, extract it.
  - Repeated UI patterns → shared component in `Common/`
  - Repeated data transforms → utility function in `utils/`
  - Repeated stateful logic → custom hook in `hooks/`
- **Extract, don't abstract prematurely.** Three similar lines are fine. A premature abstraction that handles 5 edge cases is worse than a little repetition.
- **When extracting, keep it simple.** A shared component with 10 boolean props to handle every variation is a sign you should have separate components instead.

## Comments

- Explain _why_, not _what_. If you need a comment, first try renaming the variable or function.
- Only use comments for: intent, complex logic, or warnings of consequences.
- Remove commented-out code — git has history.

## Quick-Reference Checklist

- No `console.log` in committed code
- No commented-out code — delete it (git has history)
- No `index` as React `key` for dynamic lists — use a stable, unique identifier from the data (e.g., `item.id`). If no natural key exists, generate one at creation time, not at render time.
- No `any` — use `unknown` with narrowing
- No inline styles for static values — use Tailwind or styled-components
- No unnecessary `useState` — derive values inline
- No suppressed lint warnings without an explaining comment
