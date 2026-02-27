import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SegmentedControlItemProps {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactElement<SegmentedControlItemProps>[]
  className?: string
}

export function SegmentedControl({
  value,
  onValueChange,
  children,
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-lg bg-muted p-1",
        className
      )}
    >
      {children.map((child) => {
        const isActive = value === child.props.value
        const Icon = child.props.icon
        return (
          <Button
            key={child.props.value}
            onClick={() => onValueChange(child.props.value)}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={cn(
              "gap-2 transition-all",
              isActive && "shadow-sm kz-glow"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {child.props.label}
          </Button>
        )
      })}
    </div>
  )
}

export function SegmentedControlItem({
  value,
  label,
  icon,
}: SegmentedControlItemProps) {
  return null
}
