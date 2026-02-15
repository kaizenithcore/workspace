# FocusFlow - Unified Productivity App

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

## Integration Stubs

### Firebase (Backend)
Location: `lib/firebase/config.ts` and `lib/firebase/hooks.ts`

Stubbed functions:
- `useAuth()` - Authentication hook
- `useTasks()` - Firestore tasks collection
- `useEvents()` - Firestore events collection
- `usePomodoroSessions()` - Firestore sessions collection
- `useTimeEntries()` - Firestore time entries collection

Required environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Stripe (Payments)
Location: `lib/stripe/config.ts` and `lib/stripe/checkout.ts`

Stubbed functions:
- `createCheckoutSession()` - Create Stripe checkout for Pro upgrade
- API route at `/api/stripe/create-checkout-session`

Required environment variables:
```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=
NEXT_PUBLIC_APP_URL=
```

### Google Calendar (OAuth)
Placeholder in Settings page. To implement:
1. Add Google OAuth credentials
2. Implement OAuth flow
3. Sync events bidirectionally

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

## Pro Features (Upgrade Prompts)

The following features show "Pro" banners:
- Advanced analytics in Reports
- Unlimited CSV export history
- Google Calendar integration
- Custom pomodoro durations

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. Run development server: `npm run dev`
5. Open http://localhost:3000

## Deploying to Production

1. Connect to Vercel
2. Add environment variables
3. Deploy

## License

MIT
