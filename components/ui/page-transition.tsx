/**
 * PageTransition wrapper - adds subtle entrance animation to pages
 * Respects prefers-reduced-motion
 */

import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn("kz-page-enter", className)}>
      {children}
    </div>
  )
}
