# FIREBASE OPTIMIZATION PLAN

## 1. Realtime Strategy Redesign

### A) Must remain realtime
- `tasks` (active task UX, checkbox completion, ordering feedback)
- `categories` and `projects` (filter consistency and quick-add UX)
- `users/{uid}` (preferences, plan flags, profile state)
- `notebooks/{id}/pages` only while notebook detail page is open
- `goals` + `challenges` while goals/dashboard context is open

### B) Should become on-demand (`getDocs` / `getDoc`)
- `notifications` list (read on open + optimistic updates)
- `sessions` history lists (non-live historical exploration)
- `goal_events` and `goal_snapshots` (detail/analytics only)
- notebook list when realtime is not explicitly required

### C) Should use scoped listeners
- `time_entries`: listener only in dashboard/tracker/reports routes
- `pomodoro_sessions`: listener only in pomodoro/dashboard/reports routes
- `events`: listener only in agenda/dashboard routes
- `sessions`: listener only for active/near-term windows if needed (for example 7 days)
- `challenges`: active non-archived subset only

### D) Should be paginated-only
- notebooks list
- sessions history
- notifications history
- heavy historical report inputs

### Targeted redesigns
- DataStoreProvider:
  - remove global always-on 7-listener bundle
  - keep core listeners (`categories`, `projects`, `tasks`) and route-scope the rest
- `useUserDocument` fan-out:
  - replace N parallel listeners with one centralized provider
- Sessions:
  - default paginated queries (`limit(30)`)
  - avoid full scans for statistics
- Goals/Challenges:
  - remove interval evaluation; trigger from actual data deltas
- Notebooks:
  - paginated list API + scoped realtime in details
- Notifications:
  - on-demand reads + optimistic write updates

### Listener Strategy Diagram

```mermaid
flowchart TD
  A[Auth State] --> B[UserDocProvider: single users/{uid} listener]
  B --> C[App Providers]

  C --> D[Core DataStore listeners]
  D --> D1[categories realtime]
  D --> D2[projects realtime]
  D --> D3[tasks realtime]

  C --> E[Route-scoped listeners]
  E --> E1[events realtime when agenda/dashboard]
  E --> E2[time_entries realtime when tracker/dashboard/reports]
  E --> E3[pomodoro realtime when pomodoro/dashboard/reports]

  C --> F[On-demand queries]
  F --> F1[notifications paginated getDocs]
  F --> F2[sessions paginated getDocs]
  F --> F3[goal events/snapshots on detail]

  C --> G[Notebook detail realtime]
  G --> G1[notebook doc listener]
  G --> G2[pages listener for active notebook]
```

---

## 2. Eliminate Polling

### Replace `usePremium` 60s polling
Current:
- frontend polls `/api/stripe/check-subscription` every 60s

New flow:
1. Stripe webhook updates Firestore subscription state (`users/{uid}.subscription`).
2. UI consumes state from centralized `UserDocProvider`.
3. Manual refresh remains available for settings actions.
4. Optional fallback: low-frequency refresh every 30 minutes (or on visibility regain).

### Replace challenge 60s evaluation loop
Current:
- interval-based evaluation every 60s

New flow:
1. Evaluate challenges when relevant source data actually changes (`tasks`, `timeEntries`, `pomodoroSessions`).
2. Debounce evaluations to coalesce burst updates.
3. Skip writes if computed state equals existing state.

---

## 3. Introduce Aggregation Documents

Path standard:
- `users/{uid}/aggregates/{type}`

### `users/{uid}/aggregates/sessions`
Fields:
- `totalSessions`
- `completedSessions`
- `plannedSessions`
- `activeSessions`
- `totalEstimatedDuration`
- `totalActualDuration`
- `totalPomodoros`
- `updatedAt`

Update strategy:
- Incrementally updated on session create/update/delete using `FieldValue.increment`.

Reads eliminated:
- Avoid repeated full `sessions` scans for summary stats.

### `users/{uid}/aggregates/goals`
Fields:
- `goalProgressMap` (keyed by `goalId`)
- `updatedAt`

Update strategy:
- Updated in goal progress mutation path.

Reads eliminated:
- Avoid recomputing totals from events for common progress displays.

### `users/{uid}/aggregates/challenges`
Fields:
- `activeCount`
- `completedCount`
- `failedCount`
- `updatedAt`

Update strategy:
- Updated when challenge state transitions.

Reads eliminated:
- Avoid list scans for quick challenge summaries.

---

## 4. Pagination Standard

Standard contract:
- Default page size: `limit(30)`
- Cursor-based pagination: `startAfter(lastDoc)`
- `hasMore` based on batch size
- Lazy “load more” UX

Apply to:
- notebook list
- sessions list/history
- notifications list/history
- any historical report list endpoints

Rule:
- full collection reads allowed only in explicit maintenance/migration routines

---

## 5. User Document Centralization

Introduce `UserDocProvider`:
- single `onSnapshot` on `users/{uid}`
- exposes `userDoc`, `loading`, `error`
- existing `useUserDocument` consumes provider for current user and only falls back to direct listener when needed for non-current UID

Effects:
- removes duplicate listeners in:
  - i18n
  - app shell
  - loading overlay
  - settings
  - pro banner
  - premium hook
  - pro interest form
- removes redundant header `getUserDocument` fetch

---

## 6. Search Redesign

### Option A: Denormalized search index collection (recommended for current constraints)
Path:
- `users/{uid}/notebook_search/{pageId}`
Fields:
- `notebookId`, `notebookTitle`, `pageId`, `pageTitle`, `content`, `updatedAt`

Pros:
- no external dependency
- removes N+1 page loading pattern
- easy to keep in sync in create/update/delete page flows

Cons:
- additional write amplification on page updates

### Option B: External index (Meilisearch/Algolia)
Pros:
- faster, scalable full-text search
- better ranking/highlight

Cons:
- new infrastructure + sync complexity + added cost

Decision:
- Implement Option A now, keep Option B as growth path.

---

## Ambiguities to Resolve During Implementation

- `hooks/use-user-plan.ts` appears incompatible with `useUserDocument` return shape and must be corrected while preserving behavior.
- Reports may still compute advanced metrics in-memory; only session aggregate summary is optimized in this phase.
- Notification UX currently expects global live updates; switching to on-demand keeps UX responsive but no instant cross-tab stream.
