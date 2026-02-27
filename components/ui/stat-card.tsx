import type * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  hover?: boolean
}

export function StatCard({ className, title, value, description, icon, trend, hover = true, ...props }: StatCardProps) {
  return (
    <Card className={cn(hover && "kz-card-hover", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
                {trend.value >= 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          {icon && <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
