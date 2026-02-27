"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Timer,
  Trash2,
  Calendar,
  X,
  Check,
  Pencil,
  Archive,
  RotateCcw,
  Lock,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";
import { useI18n } from "@/lib/hooks/use-i18n";
import type { Task, Category, Project } from "@/lib/types";
import { useCardTransparency } from "@/lib/hooks/use-card-transparency";

interface TaskItemProps {
  task: Task;
  categories?: Category[];
  projects?: Project[];
  allTasks?: Task[]; // For dependency checking
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStartPomodoro?: (taskId: string) => void;
  onOpenDetails?: (task: Task) => void; // Open full detail modal
}

export function TaskItem({
  task,
  categories = [],
  projects = [],
  allTasks = [],
  onUpdate,
  onDelete,
  onStartPomodoro,
  onOpenDetails,
}: TaskItemProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(task.title);
  const [editedPriority, setEditedPriority] = React.useState(
    task.priority || "low",
  );
  const [editedDueDate, setEditedDueDate] = React.useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  );
  const [editedCategoryId, setEditedCategoryId] = React.useState(
    task.categoryIds?.[0] || "",
  );
  const [editedProjectId, setEditedProjectId] = React.useState(
    task.projectId || "",
  );
  const [justCompleted, setJustCompleted] = React.useState(false);
  const prevCompletedRef = React.useRef(task.completed);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { cardClassName } = useCardTransparency();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const category = task.categoryIds
    ? categories.find((c) => c.id === task.categoryIds?.[0])
    : null;
  const project = task.projectId
    ? projects.find((p) => p.id === task.projectId)
    : null;

  // New: Calculate subtask progress
  const subtaskCount = task.subtaskCount || task.subtasks?.length || 0;
  const completedSubtasks = task.completedSubtasks || task.subtasks?.filter(st => st.completed).length || 0;
  const subtaskProgress = subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0;

  // New: Check if task is blocked
  const hasUnresolvedDependencies = React.useMemo(() => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some((depId) => {
      const depTask = allTasks.find((t) => t.id === depId);
      return depTask && !depTask.completed;
    });
  }, [task.dependencies, allTasks]);

  const isBlocked = task.blocked || hasUnresolvedDependencies;

  const handleToggleComplete = () => {
    onUpdate?.({ ...task, completed: !task.completed });
  };

  React.useEffect(() => {
    if (!prevCompletedRef.current && task.completed) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = task.completed;
  }, [task.completed]);

  const handleSaveEdit = () => {
    if (editedTitle.trim()) {
      const updatedTask: Task = {
        ...task,
        title: editedTitle.trim(),
        priority: editedPriority as "low" | "medium" | "high",
        dueDate: editedDueDate ? new Date(editedDueDate) : null,
        categoryIds: editedCategoryId ? [editedCategoryId] : [],
        projectId: editedProjectId || null,
      };
      onUpdate?.(updatedTask);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      resetEditing();
    }
  };

  const resetEditing = () => {
    setEditedTitle(task.title);
    setEditedPriority(task.priority || "low");
    setEditedDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    );
    setEditedCategoryId(task.categoryIds?.[0] || "");
    setEditedProjectId(task.projectId || "");
    setIsEditing(false);
  };

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex flex-col gap-3 rounded-lg border bg-card p-3 transition-all",
          isDragging && "opacity-50 shadow-lg", cardClassName
        )}
      >
        <div className="flex items-center gap-3">
          <button
            className="cursor-grab touch-none opacity-0 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            aria-label={
              task.completed ? "Mark as incomplete" : "Mark as complete"
            }
          />

          <Input
            ref={inputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("title")}
            className="h-8 text-sm flex-1"
          />
        </div>

        <div className="grid grid-cols-5 gap-3 ml-9">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {t("priority")}
            </label>
            <Select
              value={editedPriority}
              onValueChange={(value) =>
                setEditedPriority(value as "low" | "medium" | "high")
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("low")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {t("date")}
            </label>
            <Input
              type="date"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {t("category")}
            </label>
            <Select
              value={editedCategoryId}
              onValueChange={setEditedCategoryId}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">
                  <span className="text-muted-foreground">
                    {t("noCategory")}
                  </span>
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              {t("project")}
            </label>
            <Select value={editedProjectId} onValueChange={setEditedProjectId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder={t("selectProject")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">
                  <span className="text-muted-foreground">
                    {t("noProject")}
                  </span>
                </SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: proj.color }}
                      />
                      {proj.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 ml-9 items-center ">
            <Button
              size="sm"
              variant="default"
              onClick={handleSaveEdit}
              className="h-7 gap-1"
            >
              <Check className="h-3 w-3" />
              {t("save")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetEditing}
              className="h-7 gap-1"
            >
              <X className="h-3 w-3" />
              {t("cancel")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-shadow duration-200",
        !isDragging && "hover:shadow-sm",
        isDragging && "opacity-50 shadow-lg cursor-grabbing",
        task.completed && "opacity-60",
        isBlocked && "border-l-4 border-l-orange-500",
        justCompleted && "animate-pulse",
        cardClassName
      )}
    >
      <button
        className="cursor-grab touch-none opacity-0 group-hover:opacity-100 transition-opacity mt-1"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <Checkbox
        checked={task.completed}
        onCheckedChange={handleToggleComplete}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        className={cn("mt-1", justCompleted && "kz-check")}
      />

      <div className="flex-1 min-w-0 space-y-2">
        {/* Title and blocked badge */}
        <div className="flex items-start gap-2">
          <div
            className={cn(
              "text-sm font-medium cursor-pointer flex-1",
              task.completed && "line-through text-muted-foreground",
            )}
            onClick={() => onOpenDetails ? onOpenDetails(task) : setIsEditing(true)}
          >
            {task.title}
          </div>
          {isBlocked && (
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-400">
              <Lock className="w-3 h-3 mr-1" />
              Blocked
            </Badge>
          )}
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {task.description}
          </p>
        )}

        {/* Subtask progress */}
        {subtaskCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {completedSubtasks}/{subtaskCount} subtasks
              </span>
              <span className="text-muted-foreground">{Math.round(subtaskProgress)}%</span>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary kz-progress"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags and metadata */}
        <div className="flex flex-wrap items-center gap-1.5">
          {category && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </span>
          )}
          {project && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${project.color}20`,
                color: project.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </span>
          )}
          {task.priority && task.priority !== "low" && (
            <Tag
              variant={task.priority === "high" ? "destructive" : "warning"}
              className="text-[10px]"
            >
              {t(task.priority)}
            </Tag>
          )}
          {task.tags?.map((tag) => (
            <Tag key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Tag>
          ))}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onStartPomodoro?.(task.id)}
          aria-label="Start Pomodoro"
        >
          <Timer className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onOpenDetails && (
              <DropdownMenuItem onClick={() => onOpenDetails(task)}>
                <MoreVertical className="h-4 w-4 mr-2" />
                {t("editDetails") || "Edit Details"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {t("quickEdit") || t("edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStartPomodoro?.(task.id)}>
              <Timer className="h-4 w-4 mr-2" />
              {t("startPomodoro")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onUpdate?.({ ...task, archived: !task.archived })
              }
            >
              {task.archived ? (
                <RotateCcw className="h-4 w-4 mr-2" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              {task.archived ? t("unarchive") : t("archive")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(task.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
