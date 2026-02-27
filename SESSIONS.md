# Sessions Feature - Implementation Guide

## Overview

The Sessions feature adds a new top-level section that extends the app's productivity system by combining Goals, Tasks, Projects, and Pomodoro tracking into focused work blocks.

**Location:** `/sessions` route (navigation added to sidebar with Briefcase icon, shortcut: `S`)

## Architecture

### Data Models

#### Session
```typescript
{
  id: string
  userId: string
  title: string
  description?: string | null
  scheduledDate: Date                    // When the session is planned
  scheduledStartTime?: Date | null       // Optional specific start time
  estimatedDuration: number              // in minutes
  actualDuration?: number | null         // in minutes, set when completed
  status: "planned" | "active" | "paused" | "completed"
  projectId?: string | null              // Link to a project
  categoryId?: string | null             // Link to a category
  taskIds: string[]                      // Linked tasks
  goalIds: string[]                      // Linked goals/objectives
  pomodoroEnabled: boolean               // Enable Pomodoro mode
  sessionPomodoros: number               // Count of pomodoros completed
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
  ownerId: string
}
```

#### SessionTemplate
```typescript
{
  id: string
  userId: string
  title: string
  description?: string | null
  estimatedDuration: number              // default duration
  defaultTaskIds: string[]               // tasks to include
  defaultGoalIds: string[]               // goals to include
  projectId?: string | null              // default project
  categoryId?: string | null             // default category
  pomodoroEnabled: boolean               // enable Pomodoro by default
  createdAt: Date
  updatedAt: Date
  ownerId: string
}
```

### Firestore Collections

**Per-user collections:**
- `users/{userId}/sessions` - Main sessions
- `users/{userId}/sessionTemplates` - Session templates

### Services

#### Firestore Operations (`lib/firestore-sessions.ts`)

**Sessions CRUD:**
- `createSession(userId, sessionData)` - Create new session
- `updateSession(userId, sessionId, updates)` - Update session
- `deleteSession(userId, sessionId)` - Delete session
- `getSession(userId, sessionId)` - Get single session
- `getUserSessions(userId)` - Get all user sessions
- `getSessionsByStatus(userId, status)` - Filter by status
- `getSessionsByProject(userId, projectId)` - Filter by project
- `getSessionsByCategory(userId, categoryId)` - Filter by category

**Subscriptions (realtime):**
- `subscribeToUserSessions(userId, callback)` - Listen to all sessions
- `subscribeToSessionsByStatus(userId, status, callback)` - Listen to status-filtered

**Templates CRUD:**
- `createSessionTemplate(userId, templateData)`
- `updateSessionTemplate(userId, templateId, updates)`
- `deleteSessionTemplate(userId, templateId)`
- `getSessionTemplate(userId, templateId)`
- `getUserSessionTemplates(userId)`
- `subscribeToUserSessionTemplates(userId, callback)`

**Template Usage:**
- `createSessionFromTemplate(userId, templateId, overrides)` - Create session from template

**Statistics:**
- `getSessionStatistics(userId)` - Get session stats
- `getSessionStatisticsByProject(userId)` - Stats grouped by project

### Hooks (`lib/hooks/use-sessions.tsx`)

- `useSessions()` - Hook for all sessions
- `useSessionsByStatus(status)` - Hook for status-filtered sessions
- `useUpcomingSessions()` - Hook for "planned" status
- `useActiveSessions()` - Hook for "active" status
- `useCompletedSessions()` - Hook for "completed" status

## UI Components

### SessionCard (`components/sessions/session-card.tsx`)

Displays a session as a floating card with:
- Title and status badge
- Project/category pills
- Estimated time and pomodoro count
- Linked tasks with completion checkmarks
- Linked objectives count
- Progress bar
- Action buttons (Start/Pause/Complete/Edit/Duplicate/Delete)

**Props:**
```typescript
{
  session: Session
  categories?: Category[]
  projects?: Project[]
  tasks?: Task[]
  goals?: Goal[]
  onStart?: () => void
  onPause?: () => void
  onComplete?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  className?: string
}
```

### CreateSessionModal (`components/sessions/create-session-modal.tsx`)

Modal dialog for creating/editing sessions with fields for:
- Title (required)
- Description (optional)
- Date and time
- Estimated duration
- Project selection
- Category selection
- Task linking (with inline creation option)
- Goal/objective linking (with inline creation option)
- Pomodoro mode toggle

### SessionTemplatesTab (`components/sessions/session-templates-tab.tsx`)

View for managing session templates:
- Display template cards with metadata
- "Use Template" button to create session from template
- Edit/Delete options
- Empty state when no templates

### SessionHistoryTab (`components/sessions/session-history-tab.tsx`)

Analytics view for completed sessions:
- Session statistics cards (total, completed, avg duration, pomodoros)
- Most productive project stats
- Group sessions by date or project
- Visual progress bars for metrics

### SessionPomodoroWidget (`components/sessions/session-pomodoro-widget.tsx`)

Embedded Pomodoro timer for a session (when `pomodoroEnabled: true`):
- 25-minute timer display
- Start/Pause/Complete buttons
- Progress bar
- Pomodoro count
- Can be embedded in session detail panel

## Main Page (`app/(app)/sessions/page.tsx`)

Route: `/sessions`

Features:
- **View Toggle:** Upcoming | Active | Completed | Templates | History
- **Filters:** Search, filter by project/category/date, sort options
- **Session Grid:** 3-column responsive grid showing SessionCards
- **Quick Stats:** Shows completed/planned count, avg duration, completion rate
- **Create Button:** Opens CreateSessionModal

### View States

1. **Upcoming (default)** - "planned" status sessions
2. **Active** - "active" and "paused" status sessions
3. **Completed** - "completed" status sessions
4. **Templates** - SessionTemplatesTab view
5. **History** - SessionHistoryTab view with analytics

## Usage Examples

### Creating a Session

```typescript
const { user } = useUser()

const handleCreateSession = async (sessionData) => {
  if (!user?.uid) return
  
  await createSession(user.uid, {
    title: "Design Sprint",
    description: "Weekly design review session",
    scheduledDate: new Date("2026-02-25"),
    estimatedDuration: 120,
    status: "planned",
    projectId: "proj-123",
    categoryId: "cat-456",
    taskIds: ["task-1", "task-2"],
    goalIds: ["goal-1"],
    pomodoroEnabled: true,
    sessionPomodoros: 0,
  })
}
```

### Listening to Sessions

```typescript
const { sessions } = useSessions()
const { sessions: activeSessions } = useActiveSessions()

// Use sessions data in component
const active = sessions.filter(s => s.status === "active")
```

### Creating from Template

```typescript
const handleCreateFromTemplate = async (templateId) => {
  await createSessionFromTemplate(user.uid, templateId, {
    scheduledDate: new Date(), // Override default date
    status: "planned",
  })
}
```

### Starting a Session

```typescript
const handleStartSession = async (sessionId) => {
  await updateSession(user.uid, sessionId, {
    status: "active",
  })
}
```

### Completing a Session

```typescript
const handleCompleteSession = async (sessionId, actualDuration) => {
  await updateSession(user.uid, sessionId, {
    status: "completed",
    actualDuration, // minutes elapsed
    completedAt: new Date(),
  })
}
```

## Integration with Global Systems

### Pomodoro Integration

When a pomodoro is completed within a session:

1. The `SessionPomodoroWidget` records the pomodoro → `sessionPomodoros++`
2. A `PomodoroSession` document should be created with `sessionId` reference
3. If goals are linked, they should receive progress updates
4. The global Pomodoro stats should include these records

**Implementation point:**
Update `lib/hooks/use-global-pomodoro.ts` or Pomodoro service to check `sessionId` and update session's `sessionPomodoros` counter when a pomodoro completes.

### Task Integration

Linked tasks in a session:
- Show as list in session card with completion checkmarks
- Linked tasks also exist independently in Tasks collection
- Completing a task in Tasks should update session's task list
- Progress bar in session reflects task completion rate

### Goal Integration

Linked goals in a session:
- Displayed as "Objectives"
- Completing a session with goals should trigger goal progress updates
- Consider creating `GoalEvent` records for session completions

### Project/Category Integration

- Session categorization matches existing project/category system
- Filters work with global project/category selections
- Statistics include project grouping for productivity analysis

## Translations

All UI text is i18n-enabled with keys under `sessions.*`:

**Common keys:**
- `sessions.title` - "Sessions"
- `sessions.upcoming`, `.active`, `.completed`, `.templates`, `.history`
- `sessions.newSession`, `.createSession`, `.editSession`
- `sessions.linkedTasks`, `.linkedGoals`
- `sessions.start`, `.pause`, `.complete`, `.resume`
- `sessions.status.planned`, `.active`, `.paused`, `.completed`

**Three languages supported:** English (en), Spanish (es), Japanese (ja)

All 70+ translation keys are defined in `lib/i18n/translations.ts`

## Styling & Design

### Design System Compliance

- **Card Style:** Floating widgets with `backdrop-blur-sm`, soft shadows
- **Hover Effects:** `scale(1.01)`, enhanced shadow on hover
- **Colors:** 
  - Primary: #854cad (purple accent)
  - Status badges: color-coded (blue=planned, green=active, amber=paused, emerald=completed)
- **Spacing:** 8px modular grid (Tailwind scale)
- **Typography:** Space Grotesk, semibold headings

### Responsive Design

- Mobile: 1-column grid
- Tablet: 2-column grid (md:grid-cols-2)
- Desktop: 3-column grid (lg:grid-cols-3)

## Security

### Firestore Rules (Recommended)

```
allow read, write: if request.auth != null && resource.data.ownerId == request.auth.uid;
```

All session data is scoped to `users/{userId}/` subcollections, ensuring per-user isolation.

## Performance Considerations

1. **Indexes:** Firestore will auto-create indexes for common filters
   - userId + status
   - userId + projectId
   - userId + categoryId

2. **Realtime Listeners:** Use specific `subscribeToSessionsByStatus()` for filtered views to reduce data transfer

3. **Pagination:** Not currently implemented; consider adding for users with many sessions

## Future Enhancements

1. **Recurring Sessions** - Repeat patterns (daily, weekly, etc.)
2. **Session Sharing** - Collaborate on sessions
3. **Session Notes** - Add journal entries during/after sessions
4. **Calendar Integration** - View sessions in calendar view
5. **Session Notifications** - Reminders before scheduled sessions
6. **Custom Pomodoro Durations** - Per-session customization
7. **Session Analytics Dashboard** - Detailed productivity charts
8. **Export Sessions** - CSV export for external analysis
9. **Bulk Actions** - Select multiple sessions and edit together
10. **Session Insights** - AI-generated productivity suggestions

## Troubleshooting

### Sessions not appearing after creation
- Check that user is authenticated and has valid `uid`
- Verify Firestore rules allow user to create documents
- Check browser console for Firestore errors

### Realtime updates not working
- Ensure `subscribeToUserSessions()` is called with valid `userId`
- Check that unsubscribe function is properly managed in useEffect cleanup
- Verify Firestore connection is active

### Images/icons not showing
- Ensure lucide-react icons are imported correctly
- Check that dark mode is properly configured for color contrast

### Translations missing
- Add keys to `lib/i18n/translations.ts` under `sessions.*` namespace
- Support all three languages (en, es, ja)
- Test with `useI18n()` hook

## Files Reference

### Core
- `lib/types.ts` - Session & SessionTemplate types
- `lib/firestore-sessions.ts` - Firestore CRUD & listeners
- `lib/hooks/use-sessions.tsx` - Session state hooks
- `lib/hooks/use-session-templates.tsx` - Template state hooks

### Components
- `components/sessions/session-card.tsx`
- `components/sessions/create-session-modal.tsx`
- `components/sessions/session-templates-tab.tsx`
- `components/sessions/session-history-tab.tsx`
- `components/sessions/session-pomodoro-widget.tsx`
- `components/ui/segmented-control.tsx`

### Pages & Config
- `app/(app)/sessions/page.tsx`
- `components/layout/sidebar.tsx` (modified)
- `lib/i18n/translations.ts` (modified)
