/**
 * AnimatedNumber - Rolling number animation for Pro users
 * Smoothly transitions between number values
 */

"use client"

import * as React from "react"
import { prefersReducedMotion } from "@/lib/motion"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
  formatter?: (value: number) => string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  formatter,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(value)
  const prevValueRef = React.useRef(value)

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value)
      return
    }

    const startValue = prevValueRef.current
    const endValue = value
    const diff = endValue - startValue

    if (diff === 0) return

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = startValue + diff * easeProgress

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  // Use custom formatter if provided, otherwise use default formatting
  const formattedValue = formatter 
    ? formatter(displayValue) 
    : `${prefix}${displayValue.toFixed(decimals)}${suffix}`

  return (
    <span className={className}>
      {formattedValue}
    </span>
  )
}
