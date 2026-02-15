"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(({ className, icon, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg kz-lift focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-95",
        className,
      )}
      aria-label="Quick add"
      {...props}
    >
      {icon || <Plus className="h-6 w-6" />}
    </button>
  )
})
FAB.displayName = "FAB"

export { FAB }
