"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FAB } from "@/components/ui/fab";
import { QuickAddModal } from "@/components/modals/quick-add-modal";
import { useKeyboardShortcuts } from "@/components/providers/keyboard-shortcuts-provider";
import { useDataStore } from "@/lib/hooks/use-data-store";
import { useGlobalFilters } from "@/lib/hooks/use-global-filters";
import { useUser } from "@/lib/firebase/hooks";
import { useUserDocument } from "@/lib/hooks/use-user-document";
import { CardTransparencyProvider } from "@/lib/hooks/use-card-transparency";
import { useAppSettings } from "@/lib/hooks/use-app-settings";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const { setOpenQuickAdd } = useKeyboardShortcuts();
  const { projects, categories } = useDataStore();
  const {
    selectedProjectId,
    selectedCategoryId,
    setSelectedProjectId,
    setSelectedCategoryId,
  } = useGlobalFilters();
  const { user } = useUser();
  const { userDoc } = useUserDocument(user?.uid);
  const { focusMode } = useAppSettings();

  const backgroundUrl = userDoc?.preferences.backgroundImageUrl;
  const cardTransparency = userDoc?.preferences.cardTransparency ?? false;

  React.useEffect(() => {
    setOpenQuickAdd(() => setQuickAddOpen(true));
  }, [setOpenQuickAdd]);

  const currentProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;
  const currentCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <CardTransparencyProvider>
      <div className="min-h-screen bg-background">
        {!focusMode && (
          <Header
            projects={projects}
            categories={categories}
            currentProject={currentProject}
            currentCategory={currentCategory}
            onProjectChange={(project) =>
              setSelectedProjectId(project?.id || null)
            }
            onCategoryChange={(category) =>
              setSelectedCategoryId(category?.id || null)
            }
          />
        )}
        <div className="flex">
          {!focusMode && <Sidebar />}
          <main
            className="flex-1 overflow-auto"
            style={
              backgroundUrl
                ? {
                    backgroundImage: `url(${backgroundUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                  }
                : undefined
            }
            key={backgroundUrl || "no-bg"}
          >
            {children}
          </main>
        </div>

        {!focusMode && <FAB onClick={() => setQuickAddOpen(true)} />}

        <QuickAddModal
          categories={categories}
          projects={projects}
          defaultType="task"
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          projectId={selectedProjectId || undefined}
        />
      </div>
    </CardTransparencyProvider>
  );
}
