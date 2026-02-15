"use client"

import * as React from "react"
import { Search, CheckSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/hooks/use-i18n"
import { cn } from "@/lib/utils"
import type { Task, Category, Project } from "@/lib/types"

interface TaskSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: Task[]
  categories: Category[]
  projects: Project[]
  onSelect: (task: Task) => void
}

export function TaskSelectorModal({
  open,
  onOpenChange,
  tasks,
  categories,
  projects,
  onSelect,
}: TaskSelectorModalProps) {
  const { t } = useI18n()
  const [search, setSearch] = React.useState("")

  const filteredTasks = React.useMemo(() => {
    if (!search) return tasks
    return tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
  }, [tasks, search])

  const getCategory = (categoryId?: string) => categories.find((c) => c.id === categoryId)
  const getProject = (projectId?: string) => projects.find((p) => p.id === projectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("selectTask")}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchTasks")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-auto space-y-1 mt-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("noTasksFound")}</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const category = getCategory(task.categoryIds?.[0])
              const project = getProject(task.projectId)

              return (
                <button
                  key={task.id}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                  onClick={() => onSelect(task)}
                >
                  <div className="font-medium text-sm">{task.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {category && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {category.name}
                      </span>
                    )}
                    {project && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        {project.name}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
