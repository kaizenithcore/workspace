/**
 * Hook for playing a subtle bell/chime sound when pomodoro state changes
 * Uses Web Audio API to create a simple bell-like tone once per state change
 */

import { useCallback, useRef } from "react"

export function usePomodoroSound() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastPlayedRef = useRef<number>(0)

  /**
   * Play a subtle bell sound
   * Debounced to only play once per second to avoid duplicate sounds
   */
  const playSound = useCallback(() => {
    // Debounce to prevent multiple sounds within 1 second
    const now = Date.now()
    if (now - lastPlayedRef.current < 1000) {
      return
    }
    lastPlayedRef.current = now

    try {
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext
      }

      const ctx = audioContextRef.current
      const now = ctx.currentTime

      // Create oscillator for bell sound
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()

      // Connect oscillator to gain then to destination
      osc.connect(gain)
      gain.connect(ctx.destination)

      // LFO for pitch modulation (bell effect)
      lfo.frequency.value = 4 // Hz
      lfoGain.connect(osc.frequency)
      lfo.connect(lfoGain)

      // Set frequencies and gain
      osc.frequency.value = 800 // Hz - bell tone pitch
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5) // Fade out over 500ms
      lfoGain.gain.value = 50 // Frequency modulation depth

      // Slight frequency bend down (like a bell settling)
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.3)

      // Start and stop
      osc.start(now)
      osc.stop(now + 0.5)
      lfo.start(now)
      lfo.stop(now + 0.5)
    } catch (error) {
      // Silently fail if audio context isn't available
      console.debug("[PomodoroSound] Could not play sound:", error)
    }
  }, [])

  return { playSound }
}
