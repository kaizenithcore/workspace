"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Timer,
  Clock,
  Target,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Briefcase,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/hooks/use-i18n"
import type { TranslationKey } from "@/lib/i18n/translations"

interface NavItem {
  titleKey: TranslationKey
  href: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  badge?: string | number
}

const navItems: NavItem[] = [
  { titleKey: "dashboard", href: "/", icon: LayoutDashboard, shortcut: "D" },
  { titleKey: "agenda", href: "/agenda", icon: Calendar, shortcut: "Q" },
  { titleKey: "tasks", href: "/tasks", icon: CheckSquare, shortcut: "W" },
  { titleKey: "sessions.title", href: "/sessions", icon: Briefcase, shortcut: "S" },
  { titleKey: "pomodoro", href: "/pomodoro", icon: Timer, shortcut: "E" },
  { titleKey: "tracker", href: "/tracker", icon: Clock, shortcut: "R" },
  { titleKey: "goals.title", href: "/goals", icon: Target, shortcut: "G" },
  { titleKey: "notebooks.title", href: "/notebooks", icon: BookOpen, shortcut: "B" },
  { titleKey: "reports", href: "/reports", icon: BarChart3, shortcut: "T", badge: "Pro" },
]

const bottomNavItems: NavItem[] = [{ titleKey: "settings", href: "/settings", icon: Settings }]

interface SidebarProps {
  className?: string
  defaultCollapsed?: boolean
}
export function Sidebar({ className, defaultCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sticky top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r border-border/40 bg-sidebar/80 backdrop-blur-md transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className,
        )}
      >
        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex h-10 w-full items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground kz-glow"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {t(item.titleKey)}
                    {item.shortcut && (
                      <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {item.shortcut}
                      </kbd>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground kz-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{t(item.titleKey)}</span>
                {item.shortcut && (
                  <kbd className="ml-auto pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t p-2 space-y-1">
          {/* Keyboard Shortcuts Help */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5" />
              <span>{t("quickAddHint")}</span>
            </div>
          )}

          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t(item.titleKey)}</TooltipContent>
                </Tooltip>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate">{t(item.titleKey)}</span>
              </Link>
            )
          })}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full", collapsed ? "justify-center px-0" : "justify-start")}
            aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>{t("collapse")}</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
