import type { Notification } from "@/lib/types"

type NotificationInput = Omit<Notification, "id" | "userId" | "createdAt">

export function createTaskCompletedNotification(taskTitle: string): NotificationInput {
  return {
    type: "task",
    title: "Task completed",
    message: `"${taskTitle}" has been marked as complete`,
    read: false,
    action: {
      label: "View tasks",
      href: "/tasks",
    },
  }
}

export function createPomodoroCompletedNotification(): NotificationInput {
  return {
    type: "pomodoro",
    title: "Pomodoro completed",
    message: "Great job! Time for a break.",
    read: false,
  }
}

export function createTrackerStoppedNotification(description: string, duration: number): NotificationInput {
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return {
    type: "tracker",
    title: "Time entry saved",
    message: `Tracked ${timeStr} on "${description}"`,
    read: false,
    action: {
      label: "View tracker",
      href: "/tracker",
    },
  }
}

export function createDailySummaryNotification(stats: {
  completedTasks: number
  pomodoroSessions: number
  timeTracked: number
}): NotificationInput {
  const hours = Math.floor(stats.timeTracked / 3600)
  const minutes = Math.floor((stats.timeTracked % 3600) / 60)
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return {
    type: "system",
    title: "Daily summary",
    message: `Today: ${stats.completedTasks} tasks, ${stats.pomodoroSessions} pomodoros, ${timeStr} tracked`,
    read: false,
    action: {
      label: "View reports",
      href: "/reports",
    },
  }
}
