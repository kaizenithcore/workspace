"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Calendar, Timer, Clock, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/hooks/use-i18n"
import { cn } from "@/lib/utils"

interface OnboardingFlowProps {
  onComplete: () => void
  onSeedData: () => void
}

export function OnboardingFlow({ onComplete, onSeedData }: OnboardingFlowProps) {
  const { t } = useI18n()
  const [currentStep, setCurrentStep] = React.useState(0)

  const steps = React.useMemo(
    () => [
      {
        title: t("welcomeTitle"),
        description: t("welcomeDescription"),
        icon: Sparkles,
        content: (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">{t("agenda")}</div>
              <div className="text-xs text-muted-foreground">{t("planYourDays")}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">{t("tasks")}</div>
              <div className="text-xs text-muted-foreground">{t("trackTodos")}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Timer className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">{t("pomodoro")}</div>
              <div className="text-xs text-muted-foreground">{t("stayFocusedShort")}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">{t("tracker")}</div>
              <div className="text-xs text-muted-foreground">{t("logYourTime")}</div>
            </div>
          </div>
        ),
      },
      {
        title: t("pomodoroTechniqueTitle"),
        description: t("pomodoroTechniqueDescription"),
        icon: Timer,
        content: (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                25
              </div>
              <div>
                <div className="font-medium">{t("focusSession")}</div>
                <div className="text-sm text-muted-foreground">{t("deepWorkTime")}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-success/10">
              <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center text-success-foreground font-bold">
                5
              </div>
              <div>
                <div className="font-medium">{t("shortBreak")}</div>
                <div className="text-sm text-muted-foreground">{t("quickRecharge")}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("afterFourSessions")}</p>
          </div>
        ),
      },
      {
        title: t("readyToStartTitle"),
        description: t("readyToStartDescription"),
        icon: CheckCircle2,
        content: null,
        showSeedOption: true,
      },
    ],
    [t],
  )

  const step = steps[currentStep]
  const Icon = step.icon

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSeedAndComplete = () => {
    onSeedData()
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>

            <CardContent>
              {step.content}
              {"showSeedOption" in step && step.showSeedOption && (
                <div className="mt-6 space-y-3">
                  <Button variant="outline" className="w-full bg-transparent" onClick={handleSeedAndComplete}>
                    {t("addSampleDataExplore")}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">{t("sampleDataDescription")}</p>
                </div>
              )}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onComplete} className="text-muted-foreground">
            {t("skip")}
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep === steps.length - 1 ? t("getStarted") : t("next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
