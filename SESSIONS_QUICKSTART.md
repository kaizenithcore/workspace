# Sessions Feature - Quick Start Guide

## Installation & Setup

The Sessions feature is fully integrated into the app. No additional installation is needed.

### Access Points

1. **Navigation:** Click "Sessions" in sidebar (or press `S` keyboard shortcut)
2. **URL:** `/sessions`
3. **Route File:** `app/(app)/sessions/page.tsx`

## Quick Reference

### Create a Session (Programmatic)

```typescript
import { createSession } from '@/lib/firestore-sessions'
import { useUser } from '@/lib/firebase/hooks'

const { user } = useUser()

// Create
await createSession(user.uid, {
  title: "Code Review Sprint",
  description: "Review PRs for module X",
  scheduledDate: new Date(),
  estimatedDuration: 90,
  status: "planned",
  projectId: "proj-id",
  categoryId: "cat-id",
  taskIds: ["task-1", "task-2"],
  goalIds: ["goal-1"],
  pomodoroEnabled: true,
  sessionPomodoros: 0,
})
```

### Update Session Status

```typescript
import { updateSession } from '@/lib/firestore-sessions'

// Start a session
await updateSession(user.uid, sessionId, {
  status: "active"
})

// Complete a session (with actual duration)
await updateSession(user.uid, sessionId, {
  status: "completed",
  actualDuration: 95,  // minutes
  completedAt: new Date()
})

// Pause a session
await updateSession(user.uid, sessionId, {
  status: "paused"
})
```

### Delete Session

```typescript
import { deleteSession } from '@/lib/firestore-sessions'

await deleteSession(user.uid, sessionId)
```

### Fetch Sessions (One-time)

```typescript
import { getUserSessions, getSessionsByStatus } from '@/lib/firestore-sessions'

// Get all
const sessions = await getUserSessions(user.uid)

// Get only active
const active = await getSessionsByStatus(user.uid, "active")

// Get completed
const completed = await getSessionsByStatus(user.uid, "completed")
```

### Listen to Sessions (Real-time)

```typescript
import { subscribeToUserSessions, subscribeToSessionsByStatus } from '@/lib/firestore-sessions'

// All sessions
const unsubscribe = subscribeToUserSessions(user.uid, (sessions) => {
  console.log("Sessions updated:", sessions)
})

// Specific status
const unsubscribe = subscribeToSessionsByStatus(user.uid, "active", (sessions) => {
  console.log("Active sessions:", sessions)
})

// Remember to unsubscribe when component unmounts
useEffect(() => {
  return () => unsubscribe()
}, [])
```

### Use in Component (Recommended)

```typescript
import { useSessions, useActiveSessions } from '@/lib/hooks/use-sessions'

export function MyComponent() {
  const { sessions, loading, error } = useSessions()
  const { sessions: activeSessions } = useActiveSessions()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <h2>Total Sessions: {sessions.length}</h2>
      <h2>Active: {activeSessions.length}</h2>
    </div>
  )
}
```

### Create from Template

```typescript
import { createSessionFromTemplate } from '@/lib/firestore-sessions'

// Use template to create session
const newSession = await createSessionFromTemplate(
  user.uid, 
  templateId,
  {
    // Override fields
    scheduledDate: new Date('2026-02-26'),
  }
)
```

### Template Management

```typescript
import {
  createSessionTemplate,
  updateSessionTemplate,
  deleteSessionTemplate,
  getUserSessionTemplates
} from '@/lib/firestore-sessions'

// Create template
const template = await createSessionTemplate(user.uid, {
  title: "Daily Standup",
  description: "Team sync",
  estimatedDuration: 30,
  defaultTaskIds: ["task-1"],
  defaultGoalIds: [],
  projectId: "proj-1",
  categoryId: "cat-1",
  pomodoroEnabled: false,
})

// Update template
await updateSessionTemplate(user.uid, templateId, {
  title: "Daily Standup (Updated)"
})

// Delete template
await deleteSessionTemplate(user.uid, templateId)

// Get all templates
const templates = await getUserSessionTemplates(user.uid)
```

### Get Statistics

```typescript
import { getSessionStatistics, getSessionStatisticsByProject } from '@/lib/firestore-sessions'

// Overall stats
const stats = await getSessionStatistics(user.uid)
console.log({
  totalSessions: stats.totalSessions,
  completedSessions: stats.completedSessions,
  plannedSessions: stats.plannedSessions,
  activeSessions: stats.activeSessions,
  avgSessionDuration: stats.avgSessionDuration,
  completionRate: stats.completionRate,
  totalPomodoros: stats.totalPomodoros,
})

// Group by project
const projectStats = await getSessionStatisticsByProject(user.uid)
```

## UI Components

### Display a Session Card

```typescript
import { SessionCard } from '@/components/sessions/session-card'

<SessionCard
  session={session}
  categories={categories}
  projects={projects}
  tasks={tasks}
  goals={goals}
  onStart={() => handleStart(session.id)}
  onPause={() => handlePause(session.id)}
  onComplete={() => handleComplete(session.id)}
  onEdit={() => setEditingSession(session)}
  onDuplicate={() => handleDuplicate(session)}
  onDelete={() => handleDelete(session.id)}
/>
```

### Create/Edit Modal

```typescript
import { CreateSessionModal } from '@/components/sessions/create-session-modal'

<CreateSessionModal
  open={open}
  onOpenChange={setOpen}
  session={editingSession}
  categories={categories}
  projects={projects}
  tasks={tasks}
  goals={goals}
  onSave={handleSave}
  loading={isSaving}
/>
```

### Pomodoro Widget

```typescript
import { SessionPomodoroWidget } from '@/components/sessions/session-pomodoro-widget'

<SessionPomodoroWidget
  sessionId={session.id}
  pomodorosCompleted={session.sessionPomodoros}
  onPomodoroComplete={handlePomodoroComplete}
  isActive={session.status === 'active'}
/>
```

## Common Patterns

### Session CRUD Page

```typescript
'use client'
import { useSessions } from '@/lib/hooks/use-sessions'
import { createSession, updateSession, deleteSession } from '@/lib/firestore-sessions'
import { SessionCard } from '@/components/sessions/session-card'
import { CreateSessionModal } from '@/components/sessions/create-session-modal'

export default function Page() {
  const { user } = useUser()
  const { sessions, loading } = useSessions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)

  const handleCreateOrUpdate = async (data) => {
    if (!user) return

    if (editingSession) {
      await updateSession(user.uid, editingSession.id, data)
    } else {
      await createSession(user.uid, data)
    }
    setModalOpen(false)
    setEditingSession(null)
  }

  const handleDelete = async (sessionId) => {
    if (!user) return
    if (confirm('Delete this session?')) {
      await deleteSession(user.uid, sessionId)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={() => setModalOpen(true)}>
        New Session
      </button>

      <div className="grid gap-4">
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onEdit={() => {
              setEditingSession(session)
              setModalOpen(true)
            }}
            onDelete={() => handleDelete(session.id)}
          />
        ))}
      </div>

      <CreateSessionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        session={editingSession}
        onSave={handleCreateOrUpdate}
      />
    </div>
  )
}
```

### Filter by Status

```typescript
const { sessions: planned } = useUpcomingSessions()
const { sessions: active } = useActiveSessions()
const { sessions: completed } = useCompletedSessions()
```

### Real-time Active Sessions Counter

```typescript
import { useActiveSessions } from '@/lib/hooks/use-sessions'

export function ActiveCounter() {
  const { sessions: active } = useActiveSessions()
  
  return (
    <div className="badge">
      {active.length} Active
    </div>
  )
}
```

### Show Session Progress

```typescript
import { Progress } from '@/components/ui/progress'

export function SessionProgress({ session }) {
  let percent = 0
  
  if (session.status === 'active' && session.actualDuration) {
    percent = (session.actualDuration / session.estimatedDuration) * 100
  } else if (session.taskIds.length > 0) {
    const completed = session.taskIds.filter(id => 
      tasks.find(t => t.id === id)?.completed
    ).length
    percent = (completed / session.taskIds.length) * 100
  }
  
  return <Progress value={percent} />
}
```

## Keyboard Shortcuts

- `S` - Go to Sessions page (if sidebar available)

## Translations

All text is i18n-enabled. Key patterns:

```typescript
t('sessions.title')           // Sessions
t('sessions.newSession')      // New Session
t('sessions.start')           // Start
t('sessions.status.active')   // Active
t(`sessions.minutes`)         // min
```

See `lib/i18n/translations.ts` for all 70+ keys.

## Debugging

### Log all sessions

```typescript
const { sessions } = useSessions()
console.table(sessions)
```

### Check session structure

```typescript
const session = await getSession(user.uid, sessionId)
console.log({
  title: session.title,
  status: session.status,
  duration: session.estimatedDuration,
  tasks: session.taskIds.length,
  goals: session.goalIds.length,
  pomodoros: session.sessionPomodoros,
})
```

### Monitor real-time updates

```typescript
subscribeToUserSessions(user.uid, (sessions) => {
  console.log(`[${new Date().toLocaleTimeString()}] Sessions updated:`, sessions.length)
})
```

## Tips & Best Practices

1. **Always check user authentication** before Firestore calls
2. **Use hooks** for component state management (easier than manual subscriptions)
3. **Unsubscribe** from listeners in useEffect cleanup
4. **Handle loading and error states** for better UX
5. **Use TypeScript** - Session types are exported from lib/types.ts
6. **Validate data** before creating/updating sessions
7. **Consider Firestore billing** when doing batch queries
8. **Use status-specific hooks** for filtered views (more efficient)
9. **Remember to pass all required props** to components
10. **Test with empty states** - handle 0 sessions gracefully

## Troubleshooting

**Q: Sessions not appearing after creation?**
A: Ensure user is authenticated and Firestore rules allow write access.

**Q: Real-time updates not working?**
A: Check that unsubscribe is properly called in useEffect cleanup.

**Q: Modal won't close after save?**
A: Ensure onOpenChange is properly wired and loading state is reset.

**Q: Can't link tasks?**
A: Verify task IDs exist and are from the same project/user context.

**Q: Missing translations?**
A: Add the key to lib/i18n/translations.ts for en, es, and ja.

## Support

For detailed documentation, see the full [SESSIONS.md](./SESSIONS.md) guide.
