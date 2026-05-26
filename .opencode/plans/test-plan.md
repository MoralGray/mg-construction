# Test Plan: mg-construction-journal

## Overview

E2E test strategy using Playwright only. No unit/component/integration tests (Vitest).

## Pre-Test Audit — Issues Blocking or Affecting Tests

| # | Item | File | Issue | Impact |
|---|---|---|---|---|
| A1 | `HttpErrorInterceptor` stubs empty | `mg-api-axios-1/src/httpError.interceptor.ts` | `Error401()`, `Error503()`, `UnhandledError()` are no-ops | Cannot verify error handling behavior |
| A2 | Auth DTOs lack validation | `backend/src/auth/auth.dto.ts` | RegisterDto/LoginDto have zero `class-validator` decorators | Validation bypass — needs Playwright security audit |
| A3 | Console.log in production | `mg-router-zustand-1/src/index.ts:56` | `console.log('page', page)` on every navigation | Causes false positives in console error checks |
| A4 | `limit` prop dead code | `mg-infinite-view-tanstack` | Type-defined but never consumed | Test only to document the gap |
| A5 | 401 retry never retries | `mg-api-axios-1` | Sets `_retry=true` but never retries | Broken retry logic — needs audit |
| A6 | `virtualizedRows` prop unused | `mg-table-tanstack` | Prop defined but never consumed | Test only to document the gap |
| A7 | Legacy endpoints unused | Backend news/sources | 3 endpoints not used by journal UI | Skip or mark as deprecated in tests |
| A8 | `fetchSources()` wrong endpoint | `api.service.ts:143-154` | Calls `/api/roads` instead of `/api/sources` | Dead code — not called by UI |
| A9 | `fetchRelatedArticles()` dead code | `api.service.ts:138-141` | Unused in journal UI | Dead code — skip |
| A10 | Only 1 of 17 endpoints protected | Backend | Work-log CRUD is public | Needs Playwright security audit |
| A11 | SplashCursor/ClickSpark type safety | mg-ui-shadcn-4 | Both use `@ts-nocheck` | Cannot typecheck these — test only render output |
| A12 | No error boundary | App | No React Error Boundary | Uncaught errors crash the app |
| A13 | Mobile layout untested | App | No responsive nav; Header may overflow | Needs Playwright responsive audit |

---

## Part 1: Test Infrastructure Setup

### 1.1 For E2E (Playwright)

```
npm install -D @playwright/test -w mg-construction-journal
npx playwright install chromium firefox webkit
```

Playwright config (`apps/mg-construction-journal/playwright.config.ts`):
- `baseURL: http://localhost:3002`
- `webServer`: start both frontend + backend
- Projects: chromium, firefox, webkit
- Test dir: `./e2e`

---

## Part 2: E2E Tests — Playwright

### 2.1 Setup

```
apps/mg-construction-journal/
  e2e/
    playwright.config.ts
    fixtures/
      seed-fixture.ts          # Reset DB to known state before tests
    pages/
      HomePage.po.ts           # Page Object
      SettingsPage.po.ts       # Page Object
    helpers/
      api.ts                   # Direct API calls for test setup
```

### 2.2 Navigation (PW-1.x)

| # | Test |
|---|---|
| PW-1.1 | Click "Journal" nav → URL is `/` |
| PW-1.2 | Click "Roads" nav → URL is `/settings` |
| PW-1.3 | Active nav has underline |
| PW-1.4 | Direct `/` → HomePage loads |
| PW-1.5 | Direct `/settings` → SettingsPage loads |
| PW-1.6 | Invalid route → blank |

### 2.3 HomePage CRUD (PW-3.x)

| # | Test |
|---|---|
| PW-3.1 | Click "New Entry" → dialog with "New Work Log Entry" title |
| PW-3.2 | Fill required fields + submit → entry appears in table |
| PW-3.3 | Submit empty → validation errors |
| PW-3.4 | Cancel / X / backdrop → dialog closes, no entry created |
| PW-3.5 | Click Edit icon → form pre-filled with entry data |
| PW-3.6 | Edit fields + submit → table updated |
| PW-3.7 | Click Delete icon → confirmation dialog |
| PW-3.8 | Confirm delete → entry removed |
| PW-3.9 | Cancel delete → entry remains |

### 2.4 HomePage DataTable (PW-4.x)

| # | Test |
|---|---|
| PW-4.1 | Click row → detail modal opens |
| PW-4.2 | Pagination: Next, Prev, Last, First all work |
| PW-4.3 | Page size change (10, 20, 50, 100) works |
| PW-4.4 | Column sort: click each header toggles sort |

### 2.5 HomePage Filters (PW-5.x)

| # | Test |
|---|---|
| PW-5.1 | Click "Filter/Edit" → panel opens |
| PW-5.2 | Apply each filter individually: date range, work type, volume range, sort |
| PW-5.3 | Combined filters |
| PW-5.4 | Clear → reset to default |
| PW-5.5 | Panel stays open after Apply (Epic 14) |
| PW-5.6 | Panel closes after Clear |
| PW-5.7 | Filter badges show active filters |
| PW-5.8 | Search field filters results |

### 2.6 Detail Modal (PW-6.x)

| # | Test |
|---|---|
| PW-6.1 | Modal shows entry details |
| PW-6.2 | Entry with topicId shows related section |
| PW-6.3 | Entry without topicId hides related section |
| PW-6.4 | Related entries search filters |
| PW-6.5 | Close via X or backdrop |

### 2.7 SettingsPage (PW-7.x)

| # | Test |
|---|---|
| PW-7.1 | Roads tab active by default |
| PW-7.2 | Account tab → placeholder |
| PW-7.3 | RoadCard shows name + type |
| PW-7.4 | Click RoadCard → toggle selection (opacity) |
| PW-7.5 | Search filters roads |
| PW-7.6 | Select All / Deselect All |
| PW-7.7 | Info button → RoadDetailModal |
| PW-7.8 | Road filter panel: group, filter types, sort |
| PW-7.9 | Selected roads persist across nav (localStorage) |
| PW-7.10 | Road tab badge shows selected count |

### 2.8 Theme (PW-8.x)

| # | Test |
|---|---|
| PW-8.1 | ModeToggle dropdown has Light/Dark/System |
| PW-8.2 | Selecting Dark → dark mode |
| PW-8.3 | Selecting Light → light mode |
| PW-8.4 | Theme persists across reload |

### 2.9 Cross-feature (PW-11.x)

| # | Test |
|---|---|
| PW-11.1 | Select roads in Settings → HomePage filtered by selected roads |
| PW-11.2 | Create entry with topicId → detail modal shows related |
| PW-11.3 | Edit topicId → related section updates |

### 2.10 Error Handling (PW-10.x)

| # | Test |
|---|---|
| PW-10.1 | Backend down → "Failed to Load Entries" with retry |
| PW-10.2 | Retry button calls API again |
| PW-10.3 | Delete when backend down → toast error |
| PW-10.4 | Create/edit when backend down → toast error |
| PW-10.5 | SettingsPage when backend down → "Failed to load roads" |

---

## Part 3: Playwright Audits Needed

| # | Test | Because |
|---|---|---|
| PW-AUDIT-1 | Empty error handlers in HttpErrorInterceptor | No `Error401()`/`Error503()`/`UnhandledError()` — verify the app still recovers gracefully |
| PW-AUDIT-2 | Auth DTOs bypass validation | No decorators on RegisterDto/LoginDto — test that invalid payloads reach the service |
| PW-AUDIT-3 | 401 retry never retries | `_retry` flag set but no retry — verify the request fails with a single attempt |
| PW-AUDIT-4 | Mobile layout overflow | No responsive navigation — verify no horizontal scroll at 375px viewport |
| PW-AUDIT-5 | No error boundary | Uncaught React errors crash app — verify console errors don't break display |
| PW-AUDIT-6 | `console.log('page', page)` in production | Verify no stray console output in production build |
| PW-AUDIT-7 | All CRUD endpoints public | Verify anyone can create/update/delete work logs without auth |
| PW-AUDIT-8 | SplashCursor/ClickSpark type safety | Both use `@ts-nocheck` — verify they don't crash on mount |

---

## Part 4: Implementation Priority

| Priority | What | Why |
|----------|------|-----|
| **P0** | PW-3.1 through PW-3.9 (CRUD E2E) | End-to-end main flow |
| **P1** | PW-5.1 through PW-5.8 (filters) | Secondary feature |
| **P1** | PW-7.1 through PW-7.10 (settings) | Secondary feature |
| **P2** | PW-6.1 through PW-6.5 (detail modal) | | 
| **P2** | PW-8.1 through PW-8.4 (theme) | |
| **P2** | PW-4.1 through PW-4.4 (DataTable) | |
| **P3** | PW-10.1 through PW-10.5 (error handling) | Harder to test, lower frequency |
| **P3** | PW-AUDIT-1 through PW-AUDIT-8 | One-time audits, not regression tests |

---

## Part 5: CI Integration

```
Steps:
1. npm ci
2. npx nx run-many --target=build --all
3. Start backend (in-memory SQLite) + seed
4. Start frontend
5. npx playwright install chromium
6. npx nx run mg-construction-journal:e2e
7. Upload playwright-report/
```

Root scripts:
```json
"test:e2e": "npx nx run mg-construction-journal:e2e"
```
