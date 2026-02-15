// Seed Data Generator Script
// Run this during development or onboarding to populate the app with sample data

// This script generates sample data for:
// - 3 Tasks
// - 1 Calendar Event
// - 2 Pomodoro Sessions
// - 4 Time Entries

import type { Task, CalendarEvent, PomodoroSession, TimeEntry } from "@/lib/types"

export function generateSeedData() {
  const now = new Date()
  const userId = "seed-user"

  // Sample Tasks
  const tasks: Omit<Task, "id" | "createdAt" | "updatedAt">[] = [
    {
      userId,
      title: "Complete project documentation",
      description: "Write comprehensive docs for the API",
      completed: false,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      tags: ["work", "documentation"],
      priority: "high",
      order: 0,
    },
    {
      userId,
      title: "Review pull requests",
      description: "Check pending PRs from the team",
      completed: false,
      tags: ["work", "code-review"],
      priority: "medium",
      order: 1,
    },
    {
      userId,
      title: "Learn TypeScript generics",
      description: "Study advanced TypeScript patterns",
      completed: false,
      tags: ["learning"],
      priority: "low",
      order: 2,
    },
  ]

  // Sample Calendar Event
  const events: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">[] = [
    {
      userId,
      title: "Team Weekly Sync",
      description: "Weekly team meeting to discuss progress",
      startTime: new Date(now.setHours(10, 0, 0, 0)),
      endTime: new Date(now.setHours(11, 0, 0, 0)),
      allDay: false,
      color: "#3B82F6",
    },
  ]

  // Sample Pomodoro Sessions
  const pomodoroSessions: Omit<PomodoroSession, "id" | "createdAt">[] = [
    {
      userId,
      taskId: undefined, // Will be linked to first task if needed
      type: "pomodoro",
      duration: 1500, // 25 minutes
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId,
      taskId: undefined,
      type: "pomodoro",
      duration: 1500,
      completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  ]

  // Sample Time Entries
  const timeEntries: Omit<TimeEntry, "id" | "createdAt" | "updatedAt">[] = [
    {
      userId,
      description: "API development",
      startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      duration: 7200, // 2 hours
    },
    {
      userId,
      description: "Code review session",
      startTime: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      duration: 3600, // 1 hour
    },
    {
      userId,
      description: "Documentation writing",
      startTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 7 * 60 * 60 * 1000),
      duration: 3600, // 1 hour
    },
    {
      userId,
      description: "Team meeting",
      startTime: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
      duration: 3600, // 1 hour
    },
  ]

  return {
    tasks,
    events,
    pomodoroSessions,
    timeEntries,
  }
}

// Helper to save seed data to localStorage (for development without Firebase)
export function seedLocalStorage() {
  const data = generateSeedData()
  
  // Add IDs and timestamps
  const tasksWithIds = data.tasks.map((task, i) => ({
    ...task,
    id: `seed-task-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  const eventsWithIds = data.events.map((event, i) => ({
    ...event,
    id: `seed-event-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  const sessionsWithIds = data.pomodoroSessions.map((session, i) => ({
    ...session,
    id: `seed-session-${i}`,
    createdAt: new Date(),
  }))

  const entriesWithIds = data.timeEntries.map((entry, i) => ({
    ...entry,
    id: `seed-entry-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  localStorage.setItem("focusflow-tasks", JSON.stringify(tasksWithIds))
  localStorage.setItem("focusflow-events", JSON.stringify(eventsWithIds))
  localStorage.setItem("focusflow-pomodoro-sessions", JSON.stringify(sessionsWithIds))
  localStorage.setItem("focusflow-time-entries", JSON.stringify(entriesWithIds))

  console.log("Seed data generated:", {
    tasks: tasksWithIds.length,
    events: eventsWithIds.length,
    pomodoroSessions: sessionsWithIds.length,
    timeEntries: entriesWithIds.length,
  })

  return {
    tasks: tasksWithIds,
    events: eventsWithIds,
    pomodoroSessions: sessionsWithIds,
    timeEntries
