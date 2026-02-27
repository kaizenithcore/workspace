"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Square,
  Plus,
  Timer,
  Clock,
  Calendar,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { MultiSelect } from "@/components/ui/multi-select";
import { useDataStore } from "@/lib/hooks/use-data-store";
import { useGlobalFilters } from "@/lib/hooks/use-global-filters";
import { useI18n } from "@/lib/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import Link from "next/link";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { useCardTransparency } from "@/lib/hooks/use-card-transparency";
import { DashboardGoalsWidget } from "@/components/dashboard/goals-widget";
import { DashboardChallengesWidget } from "@/components/dashboard/challenges-widget";
import { InsightsList } from "@/components/reports/insights-list";
import { useReports } from "@/lib/hooks/use-reports";
import { ReportFilters } from "@/lib/types-reports";
import { ProInterestForm } from "@/components/ProInterestForm";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useToast } from "@/hooks/use-toast";

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const { selectedProjectId, selectedCategoryId } = useGlobalFilters();
  const { cardClassName } = useCardTransparency();
  const {
    categories,
    projects,
    tasks,
    events,
    timeEntries,
    pomodoroSessions,
    addTask,
    addEvent,
    updateTask,
    addTimeEntry,
    addSession,
  } = useDataStore();
  

  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Time tracking state
  const [isTracking, setIsTracking] = React.useState(false);
  const [trackingDescription, setTrackingDescription] = React.useState("");
  const [trackingStartTime, setTrackingStartTime] = React.useState<Date | null>(
    null,
  );
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<
    string[]
  >([]);
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>(
    [],
  );

  const today = new Date();

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const projectMatch =
        !selectedProjectId || task.projectId === selectedProjectId;
      const categoryMatch =
        !selectedCategoryId ||
        (task.categoryIds && task.categoryIds.includes(selectedCategoryId));
      return projectMatch && categoryMatch;
    });
  }, [tasks, selectedProjectId, selectedCategoryId]);

  // Today's tasks: tasks due today OR tasks with no due date that are incomplete
  const todaysTasks = React.useMemo(() => {
    return filteredTasks
      .filter((task) => {
        if (task.dueDate && isSameDay(new Date(task.dueDate), today))
          return true;
        if (!task.dueDate && !task.completed) return true;
        return false;
      })
      .sort((a, b) => {
        // Incomplete first, then by order
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [filteredTasks, today]);

  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => {
      const projectMatch =
        !selectedProjectId ||
        (event.projectIds && event.projectIds.includes(selectedProjectId));
      const categoryMatch =
        !selectedCategoryId ||
        (event.categoryIds && event.categoryIds.includes(selectedCategoryId));
      return projectMatch && categoryMatch;
    });
  }, [events, selectedProjectId, selectedCategoryId]);

  const todaysEvents = React.useMemo(() => {
    return filteredEvents.filter((event) =>
      isSameDay(new Date(event.startTime), today),
    );
  }, [filteredEvents, today]);

  const hasAnyData =
    tasks.length > 0 ||
    events.length > 0 ||
    timeEntries.length > 0 ||
    pomodoroSessions.length > 0;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("kaizenith_onboarding_done");
    if (!seen && !hasAnyData) {
      setShowOnboarding(true);
    }
  }, [hasAnyData]);

  // Stats
  const todaysSessions = pomodoroSessions.filter(
    (s) =>
      s.completedAt &&
      isSameDay(new Date(s.completedAt), today) &&
      s.type === "pomodoro",
  );
  const completedTasksToday = filteredTasks.filter(
    (t) =>
      t.completed && t.updatedAt && isSameDay(new Date(t.updatedAt), today),
  );
  const totalTimeToday = timeEntries
    .filter((e) => isSameDay(new Date(e.startTime), today))
    .reduce((acc, e) => acc + (e.duration ?? 0), 0);

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(
          Math.floor((Date.now() - trackingStartTime.getTime()) / 1000),
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, trackingStartTime]);

  const startTracking = () => {
    setIsTracking(true);
    setTrackingStartTime(new Date());
    setElapsedTime(0);
  };

  const stopTracking = () => {
    if (trackingStartTime) {
      const endTime = new Date();
      const duration = Math.floor(
        (endTime.getTime() - trackingStartTime.getTime()) / 1000,
      );

      addTimeEntry({
        projectIds: selectedProjectIds.length ? selectedProjectIds : [],
        categoryIds: selectedCategoryIds.length ? selectedCategoryIds : [],
        description: trackingDescription || t("untitled"),
        startTime: trackingStartTime,
        endTime,
        duration,
      });

      setIsTracking(false);
      setTrackingDescription("");
      setTrackingStartTime(null);
      setElapsedTime(0);
      setSelectedCategoryIds([]);
      setSelectedProjectIds([]);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      completed: false,
      dueDate: new Date(),
      tags: [],
      priority: "medium",
      order: todaysTasks.length,
      categoryIds: selectedCategoryIds.length ? selectedCategoryIds : [],
      archived: false,
      ...(selectedProjectIds.length
        ? { projectId: selectedProjectIds[0] }
        : {}),
    });
    setNewTaskTitle("");
  };

  const handleCompleteOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kaizenith_onboarding_done", "true");
    }
    setShowOnboarding(false);
  };

  const handleSeedData = async () => {
    try {
      const now = new Date();
      await addTask({
        title: t("sampleTaskFocus") || "Planificar el dia",
        completed: false,
        archived: false,
        tags: ["sample"],
        priority: "medium",
        order: 0,
        categoryIds: [],
        projectId: undefined,
      });
      await addTask({
        title: t("sampleTaskDeepWork") || "Sesion de trabajo profundo",
        completed: false,
        archived: false,
        tags: ["sample"],
        priority: "high",
        order: 1,
        categoryIds: [],
        projectId: undefined,
      });
      await addTask({
        title: t("sampleTaskReview") || "Revisar progreso semanal",
        completed: true,
        archived: false,
        tags: ["sample"],
        priority: "low",
        order: 2,
        categoryIds: [],
        projectId: undefined,
      });

      await addEvent({
        title: t("sampleEventTitle") || "Bloque de enfoque",
        startTime: now,
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        allDay: false,
        completed: false,
        archived: false,
        color: "#3B82F6",
        categoryIds: [],
        projectIds: [],
      });

      await addSession({
        type: "pomodoro",
        duration: 25 * 60,
        completedAt: now,
        projectIds: [],
        categoryIds: [],
      });
      await addSession({
        type: "pomodoro",
        duration: 25 * 60,
        completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        projectIds: [],
        categoryIds: [],
      });

      await addTimeEntry({
        description: t("sampleEntryPlanning") || "Planificacion",
        startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        duration: 60 * 60,
        categoryIds: [],
        projectIds: [],
      });
      await addTimeEntry({
        description: t("sampleEntryFocus") || "Enfoque profundo",
        startTime: new Date(now.getTime() - 90 * 60 * 1000),
        endTime: new Date(now.getTime() - 30 * 60 * 1000),
        duration: 60 * 60,
        categoryIds: [],
        projectIds: [],
      });

      toast({
        title: t("sampleDataAddedTitle") || "Datos de ejemplo listos",
        description: t("sampleDataAddedDesc") || "Se anadieron tareas, eventos y sesiones para explorar.",
      });
    } catch (error) {
      console.error("[Dashboard] Failed to seed data", error);
      toast({
        title: t("error") || "Error",
        description: t("sampleDataFailed") || "No se pudieron crear los datos de ejemplo.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = (task: Task) => {
    updateTask(task.id, { completed: !task.completed });
  };

  const handleStartPomodoro = (taskId: string) => {
    router.push(`/pomodoro?taskId=${taskId}`);
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
    color: cat.color,
  }));

  const projectOptions = projects.map((proj) => ({
    value: proj.id,
    label: proj.name,
  }));
  
// Filters state
  const [filters, setFilters] = React.useState<ReportFilters>({
    range: "week",
    compareWithPrevious: true,
    scope: "global",
  })
  const { data, loading, error } = useReports(filters)
  

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={handleCompleteOnboarding} onSeedData={handleSeedData} />
      )}
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard")}
          </h1>
          <p className="text-muted-foreground">
            {today.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          className={cardClassName}
          title={t("totalTimeTracked")}
          value={formatHours(totalTimeToday)}
          description={t("today")}
          icon={<Clock className="h-5 w-5 text-primary" />}
        />
        <StatCard
          className={cardClassName}
          title={t("pomodorosCompletedReport")}
          value={todaysSessions.length.toString()}
          description={t("today")}
          icon={<Timer className="h-5 w-5 text-primary" />}
        />
        <StatCard
          className={cardClassName}
          title={t("tasksCompleted")}
          value={completedTasksToday.length.toString()}
          description={t("today")}
          icon={<CheckSquare className="h-5 w-5 text-primary" />}
        />
        <StatCard
          className={cardClassName}
          title={t("upcomingEvents")}
          value={todaysEvents.length.toString()}
          description={t("today")}
          icon={<Calendar className="h-5 w-5 text-primary" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Pomodoro */}
        <Card className={cn("lg:col-span-2", cardClassName)}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("quickPomodoro")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pomodoro" className="gap-1">
              {t("viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <PomodoroTimer />
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className={cardClassName}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              {t("todaysTasks")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tasks")}
            >
              {t("viewAll")}
                <ArrowRight className="h-4 w-4" />

            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick Add Task */}
            <div className="flex gap-2">
              <Input
                placeholder={t("addTask")}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Task List */}
            {todaysTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t("noTasksToday")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                      task.completed && "opacity-60",
                    )}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        task.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.priority === "high" && (
                      <Badge variant="destructive" className="text-xs">
                        {t("high")}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartPomodoro(task.id)}
                    >
                      <Timer className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        
        {/* Today's Events */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">
              {t("todaysSchedule")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/agenda")}
            >
              {t("viewCalendar")}
            </Button>
          </CardHeader>
          <CardContent>
            {todaysEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t("noEvents")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{ backgroundColor: event.color || "#3B82F6" }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(event.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("goals.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardGoalsWidget />
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card className={cardClassName}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("goals.challenges")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChallengesWidget />
          </CardContent>
        </Card>

      {/* Recent Time Entries
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Time Entries</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tracker" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTimeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{entry.description}</div>
                  <div className="text-sm text-muted-foreground">{entry.project}</div>
                </div>
                <div className="text-sm font-mono">{entry.duration}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Insight Banner (Pendiente)*/}
      <div className="grid gap-6 lg:grid-cols-2">
        {data && <InsightsList insights={data.insights} className={cardClassName} />}
        <ProInterestForm location="dashboard" className={cardClassName} />
      </div>
      </div>
      
    </div>
    </>
  );
}
