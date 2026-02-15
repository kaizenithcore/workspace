"use client";

import * as React from "react";
import { Calendar, CheckSquare, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/lib/hooks/use-data-store";
import { useI18n } from "@/lib/hooks/use-i18n";
import type { QuickAddType, Task } from "@/lib/types";
import type { Category, Project, TimeEntry } from "@/lib/types";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  defaultType?: QuickAddType;
  categories?: Category[];
  projects?: Project[];
}

export function QuickAddModal({
  open,
  onOpenChange,
  projectId,
  defaultType = "task",
  categories = [],
  projects = [],
}: QuickAddModalProps) {
  const { t } = useI18n();
  const { addTask, addEvent, addTimeEntry } = useDataStore();
  const [type, setType] = React.useState<QuickAddType>(defaultType);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(""); // yyyy-mm-dd
  const [time, setTime] = React.useState(""); // hh:mm (for event)
  const [startTime, setStartTime] = React.useState(""); // hh:mm (for entry)
  const [endTime, setEndTime] = React.useState(""); // hh:mm (for entry)
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">(
    "medium",
  );

  // New: category/project selection
  const [selectedCategoryId, setSelectedCategoryId] =
    React.useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setType(defaultType);
      setTitle("");
      setDate("");
      setTime("");
      setStartTime("");
      setEndTime("");
      setPriority("medium");

      // Default project/category: prop projectId, otherwise first in list, otherwise none
      setSelectedProjectId(
        projectId ?? (projects.length ? projects[0].id : ""),
      );
      setSelectedCategoryId(categories.length ? categories[0].id : "");
    }
  }, [open, defaultType, projectId, projects, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      const parsedDate = date ? new Date(date) : new Date();

      if (type === "task") {
        // dueDate: set to noon of that day if provided
        if (date) {
          parsedDate.setHours(12, 0, 0, 0);
        }

        // Build payload without undefined fields
        const taskPayload: Omit<
          Task,
          "id" | "userId" | "createdAt" | "updatedAt"
        > = {
          title: title.trim(),
          completed: false,
          tags: [],
          priority,
          order: 0,
          categoryIds: selectedCategoryId ? [selectedCategoryId] : [],
          dueDate: date ? parsedDate : undefined,
          projectId: selectedProjectId || undefined,
        };

        await addTask(taskPayload);
      } else if (type === "event") {
        const startTimeEvent = new Date(parsedDate);
        if (time) {
          const [hours, minutes] = time.split(":").map(Number);
          startTimeEvent.setHours(hours, minutes, 0, 0);
        } else {
          startTimeEvent.setHours(9, 0, 0, 0);
        }
        const endTimeEvent = new Date(startTimeEvent.getTime() + 3600000); // 1 hour later

        const eventPayload = {
          title: title.trim(),
          startTime: startTimeEvent,
          endTime: endTimeEvent,
          allDay: false,
          color: "#3B82F6",
          categoryIds: selectedCategoryId ? [selectedCategoryId] : [],
          projectIds: selectedProjectId ? [selectedProjectId] : [],
        };

        await addEvent(eventPayload);
      } else if (type === "entry") {
        const startTimeEntry = new Date(parsedDate);
        let endTimeEntry = new Date(parsedDate);

        if (startTime) {
          const [hours, minutes] = startTime.split(":").map(Number);
          startTimeEntry.setHours(hours, minutes, 0, 0);
        } else {
          startTimeEntry.setHours(9, 0, 0, 0);
        }

        if (endTime) {
          const [hours, minutes] = endTime.split(":").map(Number);
          endTimeEntry.setHours(hours, minutes, 0, 0);
        } else {
          // If no end time, default to 1 hour after start time
          endTimeEntry = new Date(startTimeEntry.getTime() + 3600000);
        }

        const duration = Math.floor(
          (endTimeEntry.getTime() - startTimeEntry.getTime()) / 1000,
        );

        const entryPayload: Omit<
          TimeEntry,
          "id" | "userId" | "createdAt" | "updatedAt"
        > = {
          description: title.trim() || t("untitled"),
          startTime: startTimeEntry,
          endTime: endTimeEntry,
          duration,
          categoryIds: selectedCategoryId ? [selectedCategoryId] : [],
          projectIds: selectedProjectId ? [selectedProjectId] : [],
        };

        await addTimeEntry(entryPayload);
      }

      // Reset form
      setTitle("");
      setDate("");
      setTime("");
      setStartTime("");
      setEndTime("");
      setSelectedCategoryId(categories.length ? categories[0].id : "");
      setSelectedProjectId(
        projects.length ? projects[0].id : (projectId ?? ""),
      );
      onOpenChange(false);
    } catch (error) {
      console.error("[QuickAdd] Failed to save:", error);
      // Optional: show user-friendly toast if you have Toaster
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeConfig = {
    task: {
      icon: CheckSquare,
      label: t("task"),
      placeholder: t("taskPlaceholder"),
    },
    event: {
      icon: Calendar,
      label: t("event"),
      placeholder: t("eventPlaceholder"),
    },
    entry: {
      icon: Clock,
      label: t("timeEntry"),
      placeholder: t("entryPlaceholder"),
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("quickAdd")}</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as QuickAddType)}>
          <TabsList className="grid w-full grid-cols-3">
            {(
              Object.entries(typeConfig) as [
                QuickAddType,
                typeof typeConfig.task,
              ][]
            ).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <config.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {(Object.keys(typeConfig) as QuickAddType[]).map((key) => (
              <TabsContent key={key} value={key} className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label
                    className="hover:cursor-pointer"
                    htmlFor={`title-${key}`}
                  >
                    {t("title")}
                  </Label>
                  <Input
                    id={`title-${key}`}
                    placeholder={typeConfig[key].placeholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 quick-add-modal-selector">
                  <div className="space-y-2">
                    <Label>{t("category")}</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={(v) => setSelectedCategoryId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">{t("noCategory")}</SelectItem>
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

                  <div className="space-y-2 quick-add-modal-selector">
                    <Label>{t("project")}</Label>
                    <Select
                      value={selectedProjectId}
                      onValueChange={(v) => setSelectedProjectId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectProject")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">{t("noProject")}</SelectItem>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`date-${key}`}>{t("date")}</Label>
                    <Input
                      id={`date-${key}`}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  {key === "event" ? (
                    <div className="space-y-2">
                      <Label htmlFor={`time-${key}`}>{t("time")}</Label>
                      <Input
                        id={`time-${key}`}
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  ) : key === "entry" ? (
                    <div className="flex align-items-center justify-content-center gap-1">
                      <div className="space-y-2">
                        <Label htmlFor={`startTime-${key}`}>{t("fromTime")}</Label>
                        <Input
                          id={`startTime-${key}`}
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`endTime-${key}`}>{t("toTime")}</Label>
                        <Input
                          id={`endTime-${key}`}
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 quick-add-modal-selector">
                      <Label htmlFor={`priority-${key}`}>{t("priority")}</Label>
                      <Select
                        value={priority}
                        onValueChange={(v) =>
                          setPriority(v as "low" | "medium" | "high")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectPriority")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t("low")}</SelectItem>
                          <SelectItem value="medium">{t("medium")}</SelectItem>
                          <SelectItem value="high">{t("high")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="bg-transparent"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!title.trim() || isSubmitting}>
                {isSubmitting
                  ? t("adding")
                  : `${t("add")} ${typeConfig[type].label}`}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
