"use client";
import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskItem } from "@/components/tasks/task-item";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/hooks/use-i18n";
import type { Task, Category, Project } from "@/lib/types";
import { Plus } from "lucide-react";
import { QuickAddModal } from "../modals/quick-add-modal";

interface TaskListProps {
  tasks: Task[];
  categories?: Category[];
  projects?: Project[];
  categoryId?: string | null;
  projectId?: string | null;
  onTaskUpdate?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskReorder?: (taskId: string, newOrder: number) => void;
  onStartPomodoro?: (taskId: string) => void;
  className?: string;
}

export function TaskList({
  tasks,
  categories = [],
  projects = [],
  categoryId,
  projectId,
  onTaskUpdate,
  onTaskDelete,
  onTaskReorder,
  onStartPomodoro,
  className,
}: TaskListProps) {
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);

  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      onTaskReorder?.(active.id as string, newIndex);
    }
  };

  if (tasks.length === 0) {
    return (
      <>
        <QuickAddModal
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          defaultType="task"
          categories={categories}
          projects={projects}
          categoryId={categoryId || undefined}
          projectId={projectId || undefined}
        />

        <EmptyState
          icon={<CheckSquare className="h-6 w-6 text-muted-foreground" />}
          title={t("noTasks")}
          description={t("noTasksDescription")}
          action={
            <Button size="sm" className="gap-2" onClick={() => setQuickAddOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("addTask")}
            </Button>
          }
          className={className}
        />
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              categories={categories}
              projects={projects}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              onStartPomodoro={onStartPomodoro}
            />
          ))}
        </div>
      </SortableContext>

      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultType="task"
        categories={categories}
        projects={projects}
        categoryId={categoryId || undefined}
        projectId={projectId || undefined}
      />
    </DndContext>
  );
}
