# Task Pro Features: Descriptions, Subtasks & Dependencies

## Overview

This implementation adds advanced task management features with Free/Pro plan gating to drive upgrades:

- **Descriptions**: Rich text descriptions for all tasks
- **Subtasks**: Break tasks into smaller checklist items (Free: 3 max, Pro: unlimited)
- **Dependencies**: Block tasks until predecessors complete (Free: disabled, Pro: unlimited)
- **Blocked Status**: Visual indication when tasks have unresolved dependencies

## Features by Plan

### Free Plan
- ✅ Task descriptions (up to 2,000 characters)
- ✅ Up to 3 subtasks per task
- ❌ Task dependencies (disabled)

### Pro Plan
- ✅ Task descriptions (up to 10,000 characters)
- ✅ Unlimited subtasks
- ✅ Unlimited task dependencies
- ✅ Advanced blocking logic
- ✅ Dependency notifications (future)

## Implementation Files

### Core Types & Configuration
- `lib/types.ts` - Updated Task interface with new fields
- `lib/task-limits.ts` - Limit configuration and validation logic
- `hooks/use-user-plan.ts` - Hook to get user's plan status
- `hooks/use-task-limits.ts` - Hook for enforcing limits

### UI Components
- `components/tasks/task-detail-modal.tsx` - Full task editor with tabs
- `components/tasks/subtask-list.tsx` - Subtask management component
- `components/tasks/dependency-selector.tsx` - Dependency selector with search
- `components/tasks/task-item.tsx` - Updated to show new features

### API & Validation
- `app/api/tasks/validate/route.ts` - Server-side limit enforcement
- `firestore.rules` - Updated Firestore rules for new fields

### Utilities
- `lib/i18n/task-pro-translations.ts` - Translations in EN/ES/JA
- `scripts/migrate-tasks-pro-features.ts` - Migration script for existing tasks

## Usage

### 1. Create Task with Description

```typescript
import { addTask } from "@/lib/hooks/use-data-store"

await addTask({
  title: "Implement auth",
  description: "Add Firebase auth with Google sign-in and email/password...",
  priority: "high",
  // ... other fields
})
```

### 2. Add Subtasks

Open TaskDetailModal and:
1. Click "Subtasks" tab
2. Click "Add Subtask"
3. Enter subtask title
4. Press Enter to save

Free users will see an upsell message after 3 subtasks.

### 3. Add Dependencies

Open TaskDetailModal and:
1. Click "Dependencies" tab
2. Click "Add Dependency"
3. Search for tasks
4. Select tasks that must complete first

Dependencies are Pro-only, so Free users see an upgrade CTA.

### 4. View Blocked Tasks

Tasks with unresolved dependencies show:
- Orange left border
- "Blocked" badge
- List of blocking tasks in Dependencies tab

## Component Usage

### TaskDetailModal

```tsx
import { TaskDetailModal } from "@/components/tasks/task-detail-modal"

function MyComponent() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <TaskDetailModal
      task={selectedTask}
      open={isOpen}
      onOpenChange={setIsOpen}
      onSave={async (updates) => {
        await updateTask(selectedTask.id, updates)
      }}
      allTasks={allTasks} // For dependency selection
      categories={categories}
      projects={projects}
    />
  )
}
```

### SubtaskList (Standalone)

```tsx
import { SubtaskList } from "@/components/tasks/subtask-list"

function MyComponent() {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])

  return (
    <SubtaskList
      subtasks={subtasks}
      onAdd={(title) => {
        const newSubtask = {
          id: `st_${Date.now()}`,
          title,
          completed: false,
          order: subtasks.length,
          createdAt: new Date(),
        }
        setSubtasks([...subtasks, newSubtask])
      }}
      onToggle={(id) => {
        setSubtasks(
          subtasks.map((st) =>
            st.id === id ? { ...st, completed: !st.completed } : st
          )
        )
      }}
      onDelete={(id) => {
        setSubtasks(subtasks.filter((st) => st.id !== id))
      }}
    />
  )
}
```

## Configuring Limits

Edit `lib/task-limits.ts`:

```typescript
export const TASK_LIMITS = {
  FREE: {
    SUBTASKS_PER_TASK: 3, // Change this
    DEPENDENCIES_PER_TASK: 0, // 0 = disabled, or set a number
    DESCRIPTION_MAX_LENGTH: 2000,
  },
  PRO: {
    SUBTASKS_PER_TASK: Infinity,
    DEPENDENCIES_PER_TASK: Infinity,
    DESCRIPTION_MAX_LENGTH: 10000,
  },
}
```

## Server-side Validation

### API Endpoint

The `/api/tasks/validate` endpoint enforces limits server-side:

```typescript
import { validateTaskLimitsAPI } from "@/app/api/tasks/validate/route"

const validation = await validateTaskLimitsAPI(userId, task, "create")

if (!validation.valid) {
  alert(validation.errors.join(", "))
  return
}

// Proceed with save
```

### Firestore Rules

Rules validate field types and sizes:

```javascript
function validateTaskFields() {
  let data = request.resource.data;
  return (
    (!('description' in data) || data.description.size() <= 10000)
    && (!('subtasks' in data) || data.subtasks.size() <= 100)
    && (!('dependencies' in data) || data.dependencies.size() <= 50)
  );
}
```

## Migration

### Running the Migration

```bash
# Set environment variables
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-client@email.com"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Run migration
npx ts-node scripts/migrate-tasks-pro-features.ts
```

This adds new fields to all existing tasks:
- `subtasks: []`
- `dependencies: []`
- `blocked: false`
- `subtaskCount: 0`
- `completedSubtasks: 0`

## Testing

### Manual Testing Checklist

#### Free User
- [ ] Create task with description
- [ ] Add subtasks (verify limit at 3)
- [ ] See upsell message when limit reached
- [ ] Dependencies tab shows upgrade CTA
- [ ] Cannot save >2000 char description

#### Pro User
- [ ] Add >3 subtasks (no limit)
- [ ] Add multiple dependencies
- [ ] Toggle subtasks (progress bar updates)
- [ ] Mark dependency complete (unblocks task)
- [ ] See "Blocked" badge on tasks with unresolved deps

### Integration Tests

```typescript
// Test limit enforcement
describe("Task Limits", () => {
  it("should enforce subtask limit for free users", async () => {
    const task = createTask()
    task.subtasks = [makeSubtask(), makeSubtask(), makeSubtask(), makeSubtask()]

    const validation = await validateTaskLimitsAPI("free-user-id", task, "create")

    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain("Subtask limit exceeded")
  })

  it("should allow unlimited subtasks for Pro users", async () => {
    const task = createTask()
    task.subtasks = Array.from({ length: 20 }, makeSubtask)

    const validation = await validateTaskLimitsAPI("pro-user-id", task, "create")

    expect(validation.valid).toBe(true)
  })
})
```

## Troubleshooting

### Limits not enforced
- Check user's plan in Firestore (`users/{uid}/subscription/plan`)
- Verify `useUserPlan` returns correct plan
- Check browser console for validation errors

### Blocked status not updating
- Ensure `blocked` field is computed client-side
- Check that dependency task IDs exist in `allTasks`
- Verify dependencies array is saved to Firestore

### Upsell not showing
- Verify `useTaskLimits` hook is imported
- Check that `isPro` returns correct value
- Ensure limit constants are configured correctly

## Analytics Events

Track these events for product insights:

```typescript
// Example analytics integration
analytics.track("subtask_created", {
  taskId: task.id,
  subtaskCount: task.subtaskCount,
  isPro: user.isPro,
})

analytics.track("dependency_added", {
  taskId: task.id,
  dependencyCount: task.dependencies.length,
  isPro: user.isPro,
})

analytics.track("upsell_shown", {
  feature: "subtasks", // or "dependencies"
  limit: limits.subtasksPerTask,
})

analytics.track("upsell_clicked", {
  feature: "subtasks",
  currentPlan: user.plan,
})
```

## Roadmap

### Phase 2 (Future)
- [ ] Subtask due dates
- [ ] Dependency percentage completion (allow start at 50%)
- [ ] Bulk import subtasks from template
- [ ] Dependency change notifications
- [ ] Gantt-style dependency visualization
- [ ] Recurring tasks with subtask templates

## Architecture Decisions

### Why client-side + server validation?
- **Client-side**: Immediate feedback, better UX
- **Server-side**: Security, prevent bypass

### Why separate modal instead of inline?
- Cleaner UI for simple tasks
- Modal provides space for complex features
- Progressive disclosure (only show when needed)

### Why computed `blocked` field?
- Performance: avoid querying dependencies on every render
- Can be recalculated from `dependencies` array
- Cloud Function can keep it in sync (future)

## Resources

- [Feature Spec](./PRO_INTEREST_SETUP.md)
- [Translation File](./lib/i18n/task-pro-translations.ts)
- [Limit Config](./lib/task-limits.ts)
- [Migration Script](./scripts/migrate-tasks-pro-features.ts)
