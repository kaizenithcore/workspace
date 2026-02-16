# Kaizenith Workspace - Unified Productivity App

A comprehensive productivity application combining Agenda, Tasks, Pomodoro Timer, and Time Tracker in one unified interface.

## App Characteristics

- Unified workspace for planning, focus, and tracking
- Fast keyboard-first navigation and quick actions
- Modular feature areas (Agenda, Tasks, Pomodoro, Tracker, Reports)
- Responsive layout optimized for desktop and mobile
- Offline-friendly local persistence for critical state
- Pro upgrade prompts for advanced analytics and integrations

## Features

### Agenda (Calendar View)
- Week view calendar with drag-and-drop support (mock)
- Create, edit, and delete calendar events
- Mini month calendar for quick navigation
- Today button for quick access

### Task Management
- Inline task creation with Cmd/Ctrl+Enter
- Task properties: title, description, due date, priority, tags
- Filter by: Today, Upcoming, High Priority, Completed
- Bulk actions and drag-and-drop reordering (mock)
- Checkbox completion with confirmation

### Pomodoro Timer
- 25-min focus / 5-min short break / 15-min long break
- Visual circular progress ring
- Auto-suggest breaks after 4 pomodoros
- Link timer to specific tasks
- Session history tracking
- Browser notifications (requires permission)

### Time Tracker
- Start/stop manual timer with description
- Quick-add manual entries
- Edit and delete entries
- CSV export functionality
- Offline persistence via localStorage

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with CSS custom properties
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: React hooks + localStorage
- **Theme**: Dark/Light mode with next-themes

## Design System

- **Primary Color**: Pomodoro Orange (#FF6B35)
- **Font**: Inter (sans-serif)
- **Density**: Comfortable (default) / Compact mode
- **Radius**: 0.625rem

## Project Structure

```
├── app/
│   ├── (app)/              # Main app routes (authenticated)
│   │   ├── agenda/         # Calendar view
│   │   ├── tasks/          # Task management
│   │   ├── pomodoro/       # Pomodoro timer
│   │   ├── tracker/        # Time tracker
│   │   ├── reports/        # Analytics dashboard
│   │   └── settings/       # User preferences
│   ├── (auth)/             # Auth routes
│   │   └── auth/           # Login/Register page
│   └── api/                # API routes
├── components/
│   ├── calendar/           # Calendar components
│   ├── charts/             # Chart wrappers
│   ├── layout/             # App shell, header, sidebar
│   ├── modals/             # Quick add modal
│   ├── onboarding/         # First-run experience
│   ├── pomodoro/           # Timer & session history
│   ├── providers/          # Theme, keyboard shortcuts
│   ├── tasks/              # Task list & item
│   ├── tracker/            # Time tracking
│   └── ui/                 # shadcn components
├── lib/
│   ├── firebase/           # Firebase config stubs
│   ├── hooks/              # Custom React hooks
│   ├── stripe/             # Stripe config stubs
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Utility functions
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Open Quick Add modal |
| `G + A` | Go to Agenda |
| `G + T` | Go to Tasks |
| `G + P` | Go to Pomodoro |
| `G + R` | Go to Reports |
| `?` | Show keyboard shortcuts |

## Offline Support

The app persists the following data to localStorage:
- Pomodoro timer state (current session, time left)
- Time tracker active session
- UI density preference
- Onboarding completion status


## License

MIT
