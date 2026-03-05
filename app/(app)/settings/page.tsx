import { Suspense } from "react"
import SettingsPageContent from "./settings-content"

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  )
}
