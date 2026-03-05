# FIREBASE USAGE AUDIT

## 1. Global Overview

- Audit scope reviewed: client app (`app/`, `components/`, `hooks/`, `lib/`), API routes (`app/api`), Cloud Functions (`functions/src`), maintenance scripts (`scripts/`).
- Firestore read patterns identified: `getDoc` (7 call sites), `getDocs` (15), `onSnapshot` (11 active + 1 commented), Admin `.get()`/`.where().get()` in server routes/functions.
- Firestore write patterns identified: `addDoc` (8), `setDoc` (10), `updateDoc` (18), `deleteDoc` (11), `writeBatch` (9), Admin `.set({merge:true})`, Admin batch deletes in Cloud Functions.
- Real-time listeners count: 11 active Firestore listeners + 3 auth state listeners (`onAuthStateChanged`) in app pages/hooks.
- Potential high-frequency triggers:
  - `usePremium` polling every 60s (`hooks/use-premium.ts:141`) -> API route -> Firestore Admin read/write.
  - `useGoalEventListeners` challenge evaluation every 60s (`lib/hooks/use-goal-event-listeners.ts:149`) -> reads + writes in challenges/goals.
  - Notebook autosave (800-1000ms debounce) (`components/notebook/NotebookEditor.tsx`) -> frequent `updateDoc`.
  - 7 concurrent top-level listeners in `DataStoreProvider` (`lib/hooks/use-data-store.tsx`).
- Estimated scaling risk: **High** (cost and fan-out grow quickly with active users due to unpaginated listeners + polling + repeated user-doc listeners).

---

## 2. Detailed Call Inventory

### File:
`lib/firestore.ts`

### Function:
`listen<T>()`

### Firebase Method Used:
`query`, `onSnapshot`

### Trigger Context:
- Inside subscription utility
- Called by multiple feature listeners (categories/projects/tasks/events/time entries/pomodoros/notifications)

### Risk Level:
High

### Problem Identified:
Single helper powers many collection listeners; downstream subscribes to full user datasets, often without `limit()`.

### Suggested Optimization:
Introduce optional `limit`, date windows, and cursor pagination in `listen` call sites.

---

### File:
`lib/firestore.ts`

### Function:
`listenCategories`, `listenProjects`, `listenTasks`, `listenEvents`, `listenTimeEntries`, `listenPomodoros`, `listenNotifications`

### Firebase Method Used:
`onSnapshot`, `where`, `orderBy`

### Trigger Context:
- Mounted in `lib/hooks/use-data-store.tsx` for authenticated users

### Risk Level:
High

### Problem Identified:
7 concurrent real-time listeners always active in app shell. Reads scale with collection size and change volume.

### Suggested Optimization:
Lazy-subscribe by route/module; keep only critical listeners global (for example notifications + tasks), defer others.

---

### File:
`lib/hooks/use-data-store.tsx`

### Function:
`DataStoreProvider` (main `useEffect` subscription block)

### Firebase Method Used:
Indirect `onSnapshot` through `fs.listen*`

### Trigger Context:
- On auth state ready
- Long-lived app session

### Risk Level:
High

### Problem Identified:
All listeners attached even if user never opens related modules (sessions/notifications/events).

### Suggested Optimization:
Split provider by domain (`TasksProvider`, `EventsProvider`, etc.) and mount on-demand per route.

---

### File:
`lib/hooks/use-data-store.tsx`

### Function:
`reorderTasks`

### Firebase Method Used:
`updateDoc` loop through `fs.updateTask`

### Trigger Context:
- On drag/drop reorder
- Inside loop

### Risk Level:
Medium

### Problem Identified:
One write per task reordered; no batch update.

### Suggested Optimization:
Use `writeBatch` for all reordered task docs.

---

### File:
`lib/hooks/use-data-store.tsx`

### Function:
`markAllNotificationsAsRead`

### Firebase Method Used:
`updateDoc` per notification (`Promise.all` over unread)

### Trigger Context:
- User action
- Inside loop

### Risk Level:
Medium

### Problem Identified:
N writes for N unread notifications; expensive for heavy users.

### Suggested Optimization:
Use callable function / batch write; or maintain per-user `lastReadAt` marker.

---

### File:
`lib/firestore-notebooks.ts`

### Function:
`listNotebooks`

### Firebase Method Used:
`query`, `where`, `orderBy`, `getDocs`

### Trigger Context:
- Initial list fetch / refetch

### Risk Level:
High

### Problem Identified:
`filters.limit` is accepted but not applied (`limit()` not used).

### Suggested Optimization:
Apply Firestore `limit()` and cursor pagination with `startAfter`.

---

### File:
`lib/firestore-notebooks.ts`

### Function:
`subscribeToNotebooks`

### Firebase Method Used:
`onSnapshot`, `orderBy`

### Trigger Context:
- On notebooks page mount (`useNotebooks` realtime mode)

### Risk Level:
Medium

### Problem Identified:
Listens to whole notebooks subcollection sorted by `updatedAt`; no paging/windowing.

### Suggested Optimization:
Default to first page listener (for example 30 docs), load more on scroll.

---

### File:
`lib/firestore-notebooks.ts`

### Function:
`searchPages`

### Firebase Method Used:
`getDocs` (indirect via `listNotebooks` + `listPages` per notebook)

### Trigger Context:
- Search action
- Inside loop (N+1)

### Risk Level:
High

### Problem Identified:
N+1 reads: one query for notebooks plus one pages query per notebook.

### Suggested Optimization:
Index searchable content (Algolia/Meilisearch) or use denormalized search index collection.

---

### File:
`lib/firestore-notebooks.ts`

### Function:
`deleteNotebook`

### Firebase Method Used:
`getDocs`, `writeBatch`, `delete`

### Trigger Context:
- User action

### Risk Level:
Medium

### Problem Identified:
Reads all pages before delete; costly for large notebooks.

### Suggested Optimization:
Delete via backend function with recursive delete, or maintain soft-delete + async cleanup job.

---

### File:
`components/notebook/NotebookEditor.tsx`

### Function:
`autosave` (`onSave` content/title)

### Firebase Method Used:
`updateDoc` (through `updatePage`)

### Trigger Context:
- Debounced typing (800ms content, 1000ms title)

### Risk Level:
High

### Problem Identified:
Frequent writes during editing sessions.

### Suggested Optimization:
Increase debounce (2-3s), save only if changed hash, collapse title/content into single write cycle.

---

### File:
`hooks/use-notebooks.ts`

### Function:
`useNotebooks`

### Firebase Method Used:
`onSnapshot` or `getDocs`

### Trigger Context:
- On mount and option changes

### Risk Level:
Medium

### Problem Identified:
Realtime true by default, and page also does manual `refetch()` after delete, causing redundant reads.

### Suggested Optimization:
If realtime is enabled, remove explicit refetch after writes and trust listener state.

---

### File:
`app/(app)/notebooks/page.tsx`

### Function:
`handleDeleteNotebook`

### Firebase Method Used:
`deleteDoc` + `getDocs` refetch (indirect)

### Trigger Context:
- User action

### Risk Level:
Medium

### Problem Identified:
Performs explicit `refetch` despite active realtime subscription.

### Suggested Optimization:
Remove `await refetch()` when realtime listener is active.

---

### File:
`lib/firestore-sessions.ts`

### Function:
`getUserSessions`, `getSessionsByStatus`, `getSessionsByProject`, `getSessionsByCategory`

### Firebase Method Used:
`getDocs`, `query`, `where`, `orderBy`

### Trigger Context:
- On-demand fetches / stats

### Risk Level:
Medium

### Problem Identified:
No `limit()`; full-history scans.

### Suggested Optimization:
Add date windows and pagination (for example recent 50 sessions, archived history paged).

---

### File:
`lib/firestore-sessions.ts`

### Function:
`subscribeToUserSessions`, `subscribeToSessionsByStatus`, `subscribeToUserSessionTemplates`

### Firebase Method Used:
`onSnapshot`

### Trigger Context:
- Subscription lifecycle

### Risk Level:
Medium

### Problem Identified:
Full-collection listeners for sessions/templates.

### Suggested Optimization:
Scoped listeners (current week/month, active status only), switch historical data to `getDocs`.

---

### File:
`lib/firestore-sessions.ts`

### Function:
`getSessionStatistics`, `getSessionStatisticsByProject`

### Firebase Method Used:
`getDocs` (through `getUserSessions`)

### Trigger Context:
- Stats rendering

### Risk Level:
High

### Problem Identified:
Computes aggregates client-side from all sessions each call.

### Suggested Optimization:
Use pre-aggregated counters (daily/weekly rollups) or Cloud Function-maintained summary docs.

---

### File:
`lib/firestore-goals.ts`

### Function:
`subscribeToUserGoals`, `subscribeToGoalEvents`, `subscribeToUserChallenges`

### Firebase Method Used:
`onSnapshot`

### Trigger Context:
- App/page mount

### Risk Level:
Medium

### Problem Identified:
Unbounded listeners on goals/events/challenges.

### Suggested Optimization:
Keep realtime only for active goals/challenges; fetch goal events on-demand.

---

### File:
`lib/firestore-goals.ts`

### Function:
`incrementGoalProgress`

### Firebase Method Used:
`getDoc`, `writeBatch`, `batch.update`, `batch.set`

### Trigger Context:
- Triggered by task/time/pomodoro events

### Risk Level:
Medium

### Problem Identified:
Read-before-write per increment and no server transaction protection against concurrent updates.

### Suggested Optimization:
Use `runTransaction` for atomic increment, or maintain increment-only counters with `FieldValue.increment`.

---

### File:
`lib/hooks/use-goal-event-listeners.ts`

### Function:
`useGoalEventListeners`

### Firebase Method Used:
Indirect `updateDoc`/`writeBatch` via `incrementGoalProgress`, and periodic challenge evaluation

### Trigger Context:
- On tasks/timeEntries/pomodoro changes
- `setInterval` every 60s

### Risk Level:
High

### Problem Identified:
Can trigger frequent writes on live activity and periodic writes regardless of user-visible need.

### Suggested Optimization:
Debounce/batch event processing; move challenge evaluation to server scheduled job or trigger only on relevant deltas.

---

### File:
`lib/hooks/use-challenge-management.ts`

### Function:
`evaluateChallenges`

### Firebase Method Used:
`getDocs` + repeated `updateDoc`

### Trigger Context:
- Called every 60s from listener hook
- Inside loop over challenges

### Risk Level:
High

### Problem Identified:
Periodic read of all challenges + potential write burst.

### Suggested Optimization:
Evaluate only when source datasets changed materially; persist last evaluated checkpoint.

---

### File:
`lib/firestore-user.ts`

### Function:
`use-style user profile/subscription updaters` (`updateUserProfile`, `updateUserInfo`, `updateUserPreferences`, `updateUserSubscription`, `markProInterestSubmitted`)

### Firebase Method Used:
`updateDoc`

### Trigger Context:
- User actions in settings/profile/forms

### Risk Level:
Low to Medium

### Problem Identified:
Multiple independent writes can fire quickly from UI toggles.

### Suggested Optimization:
Coalesce preference updates (single `updateDoc` after short debounce).

---

### File:
`lib/firestore-user.ts`

### Function:
`ensureUserDocument`

### Firebase Method Used:
`getDoc`, `setDoc`, second `getDoc`

### Trigger Context:
- Profile page load / bootstrap

### Risk Level:
Low

### Problem Identified:
Read-create-read pattern causes extra read when creating first-time user.

### Suggested Optimization:
Return constructed default doc after create instead of re-reading immediately.

---

### File:
`lib/firestore-user.ts`

### Function:
`deleteUserData`

### Firebase Method Used:
`getDocs` + `writeBatch` loops + `deleteDoc`

### Trigger Context:
- Destructive user action

### Risk Level:
Medium

### Problem Identified:
Client-side large deletion workflows are expensive and fragile on weak networks.

### Suggested Optimization:
Delegate to callable Cloud Function only; remove client bulk delete path in production.

---

### File:
`lib/hooks/use-user-document.tsx`

### Function:
`useUserDocument`

### Firebase Method Used:
`onSnapshot(doc(users/{uid}))`

### Trigger Context:
- On mount per consumer component

### Risk Level:
High

### Problem Identified:
Many components call this hook independently, creating duplicate listeners on same doc.

### Suggested Optimization:
Centralize user doc in a provider (`UserDocProvider`) and share via context.

---

### File:
`components/layout/header.tsx`

### Function:
`loadUserDoc`

### Firebase Method Used:
`getDoc` (via `getUserDocument`)

### Trigger Context:
- On mount

### Risk Level:
Medium

### Problem Identified:
One-off fetch duplicates data already available via `useUserDocument` in other components.

### Suggested Optimization:
Consume centralized user doc context; remove extra fetch.

---

### File:
`lib/hooks/use-i18n.tsx`, `components/layout/app-shell.tsx`, `components/providers/loading-overlay.tsx`, `components/ui/pro-banner.tsx`, `components/ProInterestForm.tsx`, `app/(app)/settings/page.tsx`, `hooks/use-premium.ts`

### Function:
Multiple consumers of `useUserDocument`

### Firebase Method Used:
`onSnapshot` (indirect, duplicated)

### Trigger Context:
- Mount lifecycle across layout/providers/pages

### Risk Level:
High

### Problem Identified:
Fan-out duplicates user document listener per mounted consumer.

### Suggested Optimization:
Memoized shared store/context for user document.

---

### File:
`hooks/use-premium.ts`

### Function:
`checkSubscription` + interval refresh

### Firebase Method Used:
Indirect Firestore Admin reads/writes via `/api/stripe/check-subscription`

### Trigger Context:
- On mount
- Every 60 seconds polling

### Risk Level:
High

### Problem Identified:
Polling route triggers Stripe API + potential Firestore updates even with no UI change.

### Suggested Optimization:
Switch to webhook-driven state + manual refresh on settings open; reduce polling to 15 min fallback.

---

### File:
`app/api/stripe/check-subscription/route.ts`

### Function:
`POST`

### Firebase Method Used:
`getAdminUserDocument`, `updateAdminUserSubscription`

### Trigger Context:
- Called by frontend polling/user actions

### Risk Level:
High

### Problem Identified:
Potentially writes subscription defaults frequently; expensive at scale.

### Suggested Optimization:
Only write when state hash changed; store last-synced checksum.

---

### File:
`app/api/stripe/create-checkout-session/route.ts`

### Function:
`POST`

### Firebase Method Used:
`getAdminUserDocument`, `updateAdminUserSubscription`

### Trigger Context:
- User action (upgrade)

### Risk Level:
Low to Medium

### Problem Identified:
Best-effort sync write can fail and retry via user repetition.

### Suggested Optimization:
Idempotency key + delayed sync job if Firestore unavailable.

---

### File:
`app/api/stripe/create-billing-portal/route.ts`

### Function:
`POST`

### Firebase Method Used:
`getAdminUserDocument`

### Trigger Context:
- User action

### Risk Level:
Low

### Problem Identified:
No major cost issue; single read.

### Suggested Optimization:
Cache customerId in session if available.

---

### File:
`app/api/stripe/webhook/route.ts`

### Function:
Webhook handlers (`handleCheckoutSessionCompleted`, `handleSubscriptionUpdated`, `handleSubscriptionDeleted`, `handleInvoicePaymentFailed`, `handleInvoicePaid`)

### Firebase Method Used:
`getAdminUserByStripeCustomerId` query + `updateAdminUserSubscription`

### Trigger Context:
- Stripe webhook events

### Risk Level:
Low to Medium

### Problem Identified:
Efficient overall, but repeated query-by-customer may need index verification.

### Suggested Optimization:
Ensure index on `subscription.stripeCustomerId`; keep webhook writes idempotent.

---

### File:
`app/(auth)/auth/page.tsx`

### Function:
`ensureNewUserData`

### Firebase Method Used:
`setDoc(merge)` + `initializeDefaultChallenges` (internally `getDocs` + multiple `setDoc`)

### Trigger Context:
- Signup/auth edge recovery path

### Risk Level:
Medium

### Problem Identified:
Challenge initialization creates several writes during signup.

### Suggested Optimization:
Move initialization to backend trigger (`onCreate user`) and keep client lean.

---

### File:
`app/(app)/profile/page.tsx`

### Function:
`loadUserData`, `handleSave`

### Firebase Method Used:
`ensureUserDocument` + `getUserDocument` + updates

### Trigger Context:
- On mount and save

### Risk Level:
Medium

### Problem Identified:
Fetch-then-refetch pattern after save duplicates reads.

### Suggested Optimization:
Use optimistic local state; avoid immediate re-read if write succeeded.

---

### File:
`functions/src/index.ts`

### Function:
`deleteAccountAndData`

### Firebase Method Used:
Admin Firestore `.where().get()`, batch deletes, `admin.auth().deleteUser`

### Trigger Context:
- Callable function on user account deletion

### Risk Level:
Medium

### Problem Identified:
Potentially many reads/writes per delete operation; acceptable for infrequent destructive path.

### Suggested Optimization:
Keep as backend-only path; add operation telemetry and retries for large accounts.

---

### File:
`scripts/migrate-users.ts`

### Function:
`migrateUserData`, `seedNewUser`

### Firebase Method Used:
`getDocs`, `writeBatch`, `set`

### Trigger Context:
- Manual script execution

### Risk Level:
Low (operational)

### Problem Identified:
Not runtime-critical; but uses client SDK timestamps (`new Date`) not server timestamps.

### Suggested Optimization:
Use Admin SDK + server timestamps for migration consistency.

---

### File:
`scripts/migrate-tasks-pro-features.ts`

### Function:
`migrateTasksProFeatures`

### Firebase Method Used:
Admin `.get()` + batch `.update()`

### Trigger Context:
- Manual migration

### Risk Level:
Low (operational)

### Problem Identified:
One full scan of tasks collection; expected for migration.

### Suggested Optimization:
Run once off-peak; checkpoint progress if reruns expected.

---

### File:
`lib/firebase/hooks.ts`, `app/(app)/notebooks/page.tsx`, `app/(app)/notebooks/[id]/page.tsx`

### Function:
Auth listeners

### Firebase Method Used:
`onAuthStateChanged`

### Trigger Context:
- On mount

### Risk Level:
Medium

### Problem Identified:
Multiple auth listeners in parallel.

### Suggested Optimization:
Single shared auth provider state only.

---

### File:
`lib/firebase/config.ts`

### Function:
Firestore initialization

### Firebase Method Used:
`initializeFirestore`, `persistentLocalCache`, `persistentMultipleTabManager`

### Trigger Context:
- App startup

### Risk Level:
Low

### Problem Identified:
Dev `clearIndexedDbPersistence` may add startup overhead/noise.

### Suggested Optimization:
Gate persistence clear behind explicit debug flag.

---

### File:
`lib/firebase-admin.ts`

### Function:
`getAdminUserDocument`, `updateAdminUserSubscription`, `getAdminUserByStripeCustomerId`

### Firebase Method Used:
Admin Firestore `.get()`, `.set(merge)`, `.where().limit(1).get()`

### Trigger Context:
- API routes

### Risk Level:
Medium

### Problem Identified:
Credential fallback in development logs repeated errors; not cost-heavy but noisy and can mask failures.

### Suggested Optimization:
Short-circuit admin calls when credentials unavailable; avoid repeated failed attempts per request.

---

### File:
`Firebase Storage / Analytics / Client Functions`

### Function:
N/A

### Firebase Method Used:
N/A

### Trigger Context:
N/A

### Risk Level:
Low

### Problem Identified:
No active usage found for Firebase Storage, Firebase Analytics SDK, or client callable functions.

### Suggested Optimization:
No action required.

---

## 3. Redundancy Detection

- Duplicate queries / listeners on same logical data:
  - `users/{uid}` subscribed from many places (`useUserDocument` consumers across layout/providers/pages).
  - Header performs extra `getUserDocument` while user doc listeners already exist.
- Multiple listeners on same path:
  - 7 global listeners in `use-data-store` plus module-specific listeners (goals/notebooks/sessions).
- Refetching entire collections after write:
  - `app/(app)/notebooks/page.tsx` calls `refetch()` after `deleteNotebook` while realtime listener is active.
- Re-fetch entire collection when only one doc changes:
  - `markAllNotificationsAsRead` updates each notification doc individually.
- Queries without pagination / limit:
  - `listNotebooks` ignores `filters.limit` (`lib/firestore-notebooks.ts`).
  - sessions/goals/challenges fetchers return full datasets.
- Listeners unsubscribe status:
  - Most listeners correctly unsubscribe.
  - `use-user-document` handles unsubscribe properly.
- N+1 patterns:
  - `searchPages` loops notebooks then queries pages per notebook (`lib/firestore-notebooks.ts`).
- Queries before auth ready:
  - Guarding is generally present.
  - Ambiguity: direct auth listeners in notebook pages duplicate shared auth state and can race with app-level providers.
- Writes triggering cascading reads:
  - Notebook page autosave writes can trigger list listeners (`updatedAt`) and page listeners.
  - Goal event listeners write on task/time/pomodoro changes, which can retrigger downstream listeners.

---

## 4. Optimization Recommendations

### Recommendation 1: Consolidate `users/{uid}` listener into one provider
- Why it reduces cost:
  - Removes duplicate `onSnapshot` reads for same doc across multiple mounted components.
- Estimated impact level:
  - High
- Implementation difficulty:
  - Medium

### Recommendation 2: Route-scoped lazy data listeners
- Why it reduces cost:
  - Avoids always-on reads for collections unrelated to current screen.
- Estimated impact level:
  - High
- Implementation difficulty:
  - Medium to High

### Recommendation 3: Add pagination (`limit` + `startAfter`) to notebooks/sessions/history
- Why it reduces cost:
  - Bounds reads per screen load and per snapshot update.
- Estimated impact level:
  - High
- Implementation difficulty:
  - Medium

### Recommendation 4: Replace notification per-doc updates with batch/marker
- Why it reduces cost:
  - Converts O(N) writes to O(1) or small batch.
- Estimated impact level:
  - Medium
- Implementation difficulty:
  - Low to Medium

### Recommendation 5: Reduce Stripe subscription polling
- Why it reduces cost:
  - Avoids periodic Firestore Admin reads/writes and Stripe API calls for idle users.
- Estimated impact level:
  - High
- Implementation difficulty:
  - Medium

### Recommendation 6: Replace `searchPages` N+1 with indexed search
- Why it reduces cost:
  - Avoids read multiplication by number of notebooks.
- Estimated impact level:
  - High
- Implementation difficulty:
  - High

### Recommendation 7: Batch task reorder writes
- Why it reduces cost:
  - Converts many sequential writes to single commit.
- Estimated impact level:
  - Medium
- Implementation difficulty:
  - Low

### Recommendation 8: Move challenge evaluation off 60-second loop
- Why it reduces cost:
  - Cuts periodic reads/writes unrelated to user-visible interactions.
- Estimated impact level:
  - Medium to High
- Implementation difficulty:
  - Medium

### Recommendation 9: Prefer aggregate docs for session/goal stats
- Why it reduces cost:
  - Avoids repeated full collection scans.
- Estimated impact level:
  - High
- Implementation difficulty:
  - Medium to High

### Recommendation 10: Index strategy updates
- Why it reduces cost:
  - Reduces query latency/retries and avoids unindexed query fallback failures.
- Estimated impact level:
  - Medium
- Implementation difficulty:
  - Low
- Suggested index checks:
  - `users/{uid}/sessions`: `(status, scheduledDate desc)`
  - `users/{uid}/challenges`: if future filtering by `state/active/archived`
  - `users` root: `subscription.stripeCustomerId` (already needed by webhook/admin lookups)

---

## 5. High-Impact Refactor Plan

1. Critical fixes (must fix before scaling)
- Centralize user doc subscription (single provider).
- Stop 60s Stripe polling for all users; move to webhook-first model.
- Add pagination to notebooks/sessions and enforce `limit` usage.
- Remove N+1 search in notebooks.

2. Medium optimizations
- Domain-based lazy listeners instead of global 7-listener bundle.
- Batch task reordering and notification bulk-read operations.
- Reduce challenge evaluation cadence and trigger only on meaningful data deltas.

3. Nice-to-have improvements
- Replace profile save re-fetches with optimistic local merge.
- Cleanup redundant notebook/page auth listeners and use shared auth context only.
- Add telemetry counters for read/write volume per route.

---

## 6. Cost Scaling Simulation

Assumptions (explicit):
- Typical dashboard session keeps app open 20 minutes.
- `DataStoreProvider` active for authenticated users (7 listeners).
- User performs 20 task operations/day, 5 notebook edits/day, 10 notifications/day.
- `usePremium` polling every 60s remains active in current architecture.

### 100 users
- Baseline listener fan-out manageable but non-trivial.
- Approx bottlenecks:
  - Realtime full-collection listeners for tasks/events/time entries.
  - Premium polling (about 144k checks/day if users stay active all day; lower in realistic mixed usage).
- Risk: Medium.

### 1,000 users
- Reads from unbounded listeners and periodic polling become dominant cost driver.
- Autosave + list listeners amplify write-triggered read cascades.
- Search N+1 starts causing visible latency and read spikes.
- Risk: High.

### 10,000 users
- Current pattern is not cost-efficient:
  - Large, always-on listener footprint.
  - Frequent polling and challenge loops.
  - Full-scan aggregations in sessions/goals.
- Bottlenecks:
  - `use-data-store` global listeners
  - `use-premium` polling path
  - `searchPages` N+1
  - Stats computed by scanning full collections
- Risk: High (requires architectural changes before this scale).

---

## 7. Final Summary

Top 5 most expensive patterns:
1. Global always-on 7 collection listeners per authenticated session (`lib/hooks/use-data-store.tsx`).
2. Duplicate `users/{uid}` listeners across many components (`useUserDocument` fan-out).
3. Subscription polling every 60 seconds via `/api/stripe/check-subscription` (`hooks/use-premium.ts`).
4. Notebook search N+1 query strategy (`lib/firestore-notebooks.ts` -> `searchPages`).
5. Full-collection reads for stats/history without pagination (`lib/firestore-sessions.ts`, goals/snapshots/challenges).

Quick wins (<1 hour fixes):
- Remove notebooks `refetch()` after delete when realtime is enabled.
- Batch `reorderTasks` writes.
- Debounce and merge preference updates in settings.
- Increase notebook autosave delay from 800/1000ms to a safer write cadence.

Structural improvements:
- Introduce shared user-doc provider.
- Split data listeners by route/domain.
- Add pagination/cursors everywhere lists can grow.
- Shift heavy aggregate logic to backend summaries/functions.

Scalability verdict:
- Current architecture is functional for small cohorts but **not cost-scalable for production growth** without listener scoping, pagination, and polling reduction.

---

## Ambiguities / Notes

- `hooks/use-user-plan.ts` appears to destructure `{ user }` from `useUserDocument()` while the hook returns `{ userDoc }`; verify this path before refactoring.
- Some `firebase-admin` credential errors in local logs are environment-related and do not always indicate production cost issues.
- This audit analyzes runtime code paths and included maintenance scripts/functions; script costs are operational, not per-user runtime.
