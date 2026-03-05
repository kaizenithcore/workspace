import { Suspense } from "react"
import PomodoroPageContent from "./pomodoro-content"

export default function PomodoroPage() {
  return (
    <Suspense fallback={null}>
      <PomodoroPageContent />
    </Suspense>
  )
}
