# Kaizenith Workspace - Unified Productivity Platform

A comprehensive productivity application combining Task Management, Goals, Notebooks, Sessions, Pomodoro Timer, Time Tracker, Agenda, and Analytics in one unified interface. Built with Firebase, Next.js, and modern React patterns.

## App Characteristics

- **Unified workspace** for planning, focus, tracking, and growth
- **Keyboard-first navigation** with single-key shortcuts
- **Modular feature areas**: Dashboard, Agenda, Tasks, Goals, Notebooks, Sessions, Pomodoro, Tracker, Reports, Settings
- **Responsive layout** optimized for desktop and mobile
- **Real-time sync** with Firebase Firestore
- **Offline support** with persistent local cache
- **Free & Pro plans** with smart upgrade prompts
- **Multi-language support** (English, Spanish, Japanese)
- **Dark/Light/System themes**

## Core Features

### 📊 Dashboard
- Overview of active tasks, goals, and sessions
- Quick stats and productivity trends
- Active challenges and goal progress
- Quick access to all feature areas

### 📅 Agenda (Calendar View)
- Week view calendar with drag-and-drop support
- Create, edit, and delete calendar events
- Mini month calendar for quick navigation
- Integrated with tasks and sessions
- Today button for quick access

### ✅ Task Management
- Inline task creation with natural date parsing
- **Task properties**: title, description, due date, priority, tags, categories, projects
- **Advanced features** (Pro):
  - Rich text descriptions (up to 10,000 characters)
  - Unlimited subtasks with progress tracking
  - Task dependencies and blocking logic
  - Dependency notifications
- **Filtering**: Today, Upcoming, High Priority, Overdue, Completed
- Bulk actions and drag-and-drop reordering
- Checkbox completion with visual feedback
- Task detail modal with tabbed interface

### 🎯 Goals
- Multiple goal types: count, time, streak, metric, milestone
- Auto-calculation from tasks, time entries, or pomodoro sessions
- Visual progress tracking with charts
- Goal categories and projects
- Challenge integration
- Active/Paused/Completed/Failed states
- Streaks and milestone tracking

### 📓 Notebooks
- Rich text note-taking with autosave
- Page-based organization within notebooks
- Convert notebook content to tasks, sessions, or goals
- Real-time collaboration ready
- Markdown support
- Offline-friendly with sync

### 🧘 Sessions
- Plan focused work sessions
- Link to tasks, goals, projects, and categories
- Pomodoro integration
- Status tracking: Planned, Active, Paused, Completed
- Estimated vs actual duration tracking
- Session history and analytics

### 🍅 Pomodoro Timer
- Customizable focus/break durations (default: 25/5/15 min)
- Visual circular progress ring
- Auto-suggest breaks after 4 pomodoros
- Link timer to specific tasks and sessions
- Session history tracking
- Browser notifications (with permission)
- Sound alerts (configurable)

### ⏱️ Time Tracker
- Start/stop manual timer with description
- Link to tasks, projects, and categories
- Quick-add manual entries
- Edit and delete entries
- CSV export functionality
- Real-time duration display
- Offline persistence via localStorage

### 📈 Reports & Analytics
- Time distribution charts (by category, project, priority)
- Task completion trends
- Goal progress visualization
- Productivity heatmaps
- Weekly/Monthly summaries
- Export capabilities

### ⚙️ Settings
- **Appearance**: Theme (light/dark/system), language, card transparency, custom backgrounds
- **Categories & Projects**: Create, edit, reorder with drag-and-drop, color-code
- **Pomodoro Settings**: Configure focus, short break, and long break durations
- **Notifications**: Browser notification preferences
- **Billing**: View current plan, upgrade options (Stripe integration coming soon)
- **Account Management**: Delete account and all data

### 👤 Profile
- User information and preferences
- Plan status display
- Activity overview

## Features by Plan

### Free Plan
- Up to 5 categories
- Up to 5 projects
- Task descriptions (up to 2,000 characters)
- Up to 3 subtasks per task
- Basic reports and analytics
- All core features

### Pro Plan (Individual)
- ✅ Unlimited categories and projects
- ✅ Rich task descriptions (up to 10,000 characters)
- ✅ Unlimited subtasks
- ✅ Task dependencies and blocking
- ✅ Advanced analytics and reports
- ✅ Integrated goals calendar
- ✅ Priority support

> **Note**: Payment integration with Stripe is under development and will be available when there's sufficient demand and interest.

## Technical Stack

- **Framework**: Next.js 16 with App Router and Server Components
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4 with CSS custom properties
- **UI Components**: Radix UI primitives + shadcn/ui
- **Backend**: Firebase 12.7.0 (Firestore + Authentication)
- **Animations**: Framer Motion 12
- **Charts**: Recharts 2.15
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns 4.1
- **Icons**: Lucide React
- **Theme**: next-themes with system preference detection
- **State Management**: React hooks + Firebase real-time subscriptions
- **Offline Support**: Firebase persistent cache + localStorage

## Design System

- **Primary Color**: Pomodoro Orange (#FF6B35)
- **Font**: Inter (sans-serif, variable)
- **Theme**: Dark/Light mode with seamless transitions
- **Border Radius**: 0.625rem (consistent across components)
- **Spacing**: Tailwind default scale
- **Components**: Based on shadcn/ui with custom styling

## Project Structure

```
├── app/
│   ├── (app)/              # Main app routes (authenticated)
│   │   ├── dashboard/      # Dashboard overview
│   │   ├── agenda/         # Calendar view
│   │   ├── tasks/          # Task management
│   │   ├── goals/          # Goals tracking
│   │   ├── notebooks/      # Note-taking
│   │   │   └── [id]/       # Individual notebook editor
│   │   ├── sessions/       # Focus sessions
│   │   ├── pomodoro/       # Pomodoro timer
│   │   ├── tracker/        # Time tracker
│   │   ├── reports/        # Analytics dashboard
│   │   ├── settings/       # User preferences & billing
│   │   └── profile/        # User profile
│   ├── (auth)/             # Auth routes
│   │   └── auth/           # Login/Register page
│   ├── api/                # API routes
│   │   ├── feedback/       # Feedback submission
│   │   ├── pro-interest/   # Pro plan interest tracking
│   │   ├── tasks/          # Task validation
│   │   └── stripe/         # Payment webhooks (planned)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── calendar/           # Calendar components
│   ├── charts/             # Chart wrappers & visualizations
│   ├── dashboard/          # Dashboard widgets
│   ├── goals/              # Goal cards, modals, and tracking
│   ├── layout/             # App shell, header, sidebar
│   ├── modals/             # Quick add, event, task selector modals
│   ├── notebook/           # Notebook editor, list, sidebar, conversion
│   ├── onboarding/         # First-run experience
│   ├── pomodoro/           # Timer, session history, floating widget
│   ├── pro/                # Pro upgrade modals and banners
│   ├── providers/          # Theme, keyboard shortcuts, loading overlay
│   ├── reports/            # Report components and charts
│   ├── sessions/           # Session cards and management
│   ├── tasks/              # Task list, item, detail modal, subtasks, dependencies
│   ├── tracker/            # Time tracking components, floating timer
│   └── ui/                 # shadcn base components (button, card, etc.)
├── hooks/
│   ├── use-autosave.ts     # Debounced autosave logic
│   ├── use-mobile.ts       # Mobile detection
│   ├── use-notebook.ts     # Fetch single notebook
│   ├── use-notebooks.ts    # Fetch all notebooks
│   ├── use-pomodoro-sound.ts # Sound playback
│   ├── use-task-limits.ts  # Enforce Free/Pro limits
│   ├── use-toast.ts        # Toast notifications
│   └── use-user-plan.ts    # User plan status
├── lib/
│   ├── firebase/           # Firebase config, auth hooks, collection hooks
│   ├── hooks/              # App settings, data store, i18n, user document
│   ├── i18n/               # Translation files (EN, ES, JA)
│   ├── reports/            # Report calculation logic
│   ├── stripe/             # Stripe config (planned)
│   ├── auth.ts             # Auth utilities
│   ├── firebase-admin.ts   # Admin SDK setup
│   ├── firestore-goals.ts  # Goal CRUD operations
│   ├── firestore-notebooks.ts # Notebook CRUD operations
│   ├── firestore-sessions.ts # Session CRUD operations
│   ├── firestore-user.ts   # User preferences & data management
│   ├── firestore.ts        # Firestore utilities
│   ├── notebook-types.ts   # Notebook TypeScript types
│   ├── notebook-utils.ts   # Notebook helper functions
│   ├── notifications.ts    # Notification helpers
│   ├── task-limits.ts      # Free/Pro limit enforcement
│   ├── task-validation.ts  # Task validation logic
│   ├── types-reports.ts    # Report-specific types
│   ├── types.ts            # Core TypeScript interfaces
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
├── scripts/                # Migration and seed scripts
├── functions/              # Firebase Cloud Functions
└── webhooks/               # Webhook handlers
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Open Quick Add modal |
| `Q` | Go to Dashboard |
| `W` | Go to Agenda |
| `E` | Go to Tasks |
| `R` | Go to Reports |
| `T` | Go to Tracker |
| `A` | Go to Goals |
| `S` | Go to Sessions |
| `D` | Go to Notebooks |
| `F` | Go to Pomodoro |

> **Note**: Shortcuts are disabled when typing in input fields or textareas.

## Offline Support

The app provides offline-first functionality with:
- **Firebase Persistent Cache**: Automatic offline data with multi-tab support
- **localStorage**: Pomodoro timer state, time tracker active session, UI preferences
- **Optimistic Updates**: Instant UI feedback before Firebase confirmation
- **Auto-Sync**: Seamless sync when connection is restored

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Firebase project with Firestore and Authentication enabled

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd kaizenith-workspace

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Run development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration (optional, for future use)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Development
NEXT_PUBLIC_FORCE_PLAN=pro # Optional: Force Pro plan in development
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication (Email/Password and Google providers)
4. Deploy Firestore security rules from `firestore.rules`
5. Deploy Firestore indexes from `firestore.indexes.json`

### Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

The app is optimized for deployment on Vercel with automatic CI/CD.

## Documentation

- [Notebook Feature Quick Start](./NOTEBOOK_QUICK_START.md) - Guide to notebook implementation
- [Sessions Documentation](./SESSIONS_QUICKSTART.md) - Sessions feature guide
- [Task Pro Features](./TASK_PRO_FEATURES.md) - Advanced task management
- [Notebook Implementation](./NOTEBOOK_IMPLEMENTATION.md) - Technical details
- [Pro Interest Setup](./PRO_INTEREST_SETUP.md) - Pro plan interest tracking

## Contributing

Contributions are welcome! Please ensure your code:
- Follows TypeScript best practices
- Includes proper error handling
- Maintains responsive design
- Updates translations for all three languages (EN, ES, JA)
- Passes linting (`pnpm lint`)

## License

MIT
