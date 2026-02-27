/**
 * Motion utilities for consistent animations across the app
 * All animations respect prefers-reduced-motion
 */

// Animation duration constants (in ms)
export const DURATION = {
  micro: 120,
  fast: 180,
  normal: 250,
  slow: 350,
  idle: 4000, // For idle/breathing animations
} as const

// Easing curves
export const EASE = {
  out: [0.16, 1, 0.3, 1], // cubic-bezier(0.16, 1, 0.3, 1)
  inOut: [0.45, 0, 0.55, 1], // cubic-bezier(0.45, 0, 0.55, 1)
  spring: { type: "spring", stiffness: 400, damping: 30 },
  springGentle: { type: "spring", stiffness: 200, damping: 25 },
} as const

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Common animation variants for Framer Motion
 */
export const variants = {
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  // Slide down (for modals)
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  // Scale (for modals, dropdowns)
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  // Success check animation
  successCheck: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.4,
        times: [0, 0.6, 1],
        ease: "easeOut",
      },
    },
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },

  // List item
  listItem: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
  },
}

/**
 * Transition presets
 */
export const transitions = {
  fast: {
    duration: DURATION.fast / 1000,
    ease: EASE.out,
  },
  normal: {
    duration: DURATION.normal / 1000,
    ease: EASE.out,
  },
  slow: {
    duration: DURATION.slow / 1000,
    ease: EASE.out,
  },
  spring: EASE.spring,
  springGentle: EASE.springGentle,
} as const

/**
 * Hover animation presets for interactive elements
 */
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: transitions.fast,
}

export const hoverLift = {
  whileHover: { y: -2 },
  whileTap: { y: 0 },
  transition: transitions.fast,
}

/**
 * Number rolling animation utility
 * For Pro users only
 */
export const rollNumber = (
  element: HTMLElement,
  start: number,
  end: number,
  duration: number = 1000
) => {
  if (prefersReducedMotion()) {
    element.textContent = end.toString()
    return
  }

  const startTime = performance.now()
  const diff = end - start

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    const current = Math.floor(start + diff * easeProgress)
    
    element.textContent = current.toString()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}

/**
 * Pulse animation for saving indicators
 */
export const savePulse = {
  scale: [1, 1.05, 1],
  opacity: [0.5, 1, 0.5],
  transition: {
    duration: 1.5,
    repeat: 2,
    ease: "easeInOut",
  },
}

/**
 * Breathing animation for active states
 * Very subtle, runs continuously
 */
export const breathe = {
  scale: [1, 1.02, 1],
  opacity: [0.8, 1, 0.8],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

/**
 * Shimmer animation for Pro CTAs
 * Very subtle gradient shift
 */
export const shimmer = {
  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "linear",
  },
}

/**
 * Float animation for empty states
 */
export const float = {
  y: [0, -10, 0],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  },
}
