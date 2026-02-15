"use client"

import { useCallback, useEffect, useState } from "react"

type Density = "comfortable" | "compact"

export function useDensity() {
  const [density, setDensityState] = useState<Density>("comfortable")

  useEffect(() => {
    const stored = localStorage.getItem("density") as Density | null
    if (stored) {
      setDensityState(stored)
      document.body.classList.remove("density-comfortable", "density-compact")
      document.body.classList.add(`density-${stored}`)
    }
  }, [])

  const setDensity = useCallback((newDensity: Density) => {
    setDensityState(newDensity)
    localStorage.setItem("density", newDensity)
    document.body.classList.remove("density-comfortable", "density-compact")
    document.body.classList.add(`density-${newDensity}`)
  }, [])

  return { density, setDensity }
}
