"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { FAB } from "@/components/ui/fab";
import { QuickAddModal } from "@/components/modals/quick-add-modal";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/components/providers/keyboard-shortcuts-provider";
import { useDataStore } from "@/lib/hooks/use-data-store";
import { useGlobalFilters } from "@/lib/hooks/use-global-filters";
import { useUser } from "@/lib/firebase/hooks";
import { useUserDocument } from "@/lib/hooks/use-user-document";
import { CardTransparencyProvider } from "@/lib/hooks/use-card-transparency";
import { useAppSettings } from "@/lib/hooks/use-app-settings";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { EarlyAccessFeedbackWidget } from "@/components/early-access-feedback-widget";

const GUEST_ACCESS_KEY = "kaizenith-guest-access-allowed";

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
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { userDoc } = useUserDocument(user?.uid);
  const { focusMode } = useAppSettings();
  const [guestAccessAllowed, , guestAccessLoaded] = useLocalStorage<boolean>(
    GUEST_ACCESS_KEY,
    false,
  );

  const backgroundUrl = userDoc?.preferences.backgroundImageUrl;
  const cardTransparency = userDoc?.preferences.cardTransparency ?? false;

  React.useEffect(() => {
    setOpenQuickAdd(() => setQuickAddOpen(true));
  }, [setOpenQuickAdd]);

  const shouldBlockAnonymous =
    !!user?.isAnonymous && guestAccessLoaded && !guestAccessAllowed;
  const isWaitingForGuestAccess = !!user?.isAnonymous && !guestAccessLoaded;

  React.useEffect(() => {
    if (!authLoading && (!user || shouldBlockAnonymous)) {
      router.replace("/auth");
    }
  }, [authLoading, user, shouldBlockAnonymous, router]);

  React.useEffect(() => {
    if (!authLoading && shouldBlockAnonymous) {
      signOut(auth).catch((error) => {
        console.error("[AppShell] Failed to sign out anonymous user:", error);
      });
    }
  }, [authLoading, shouldBlockAnonymous]);

  const currentProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;
  const currentCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  if (!authLoading && (!user || shouldBlockAnonymous || isWaitingForGuestAccess)) {
    return null;
  }

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
            <div className="flex justify-center px-4 pb-12 pt-10 sm:px-6 lg:px-8">
              <EarlyAccessFeedbackWidget pageContext="dashboard" />
            </div>
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
          categoryId={selectedCategoryId || undefined}
        />
      </div>
    </CardTransparencyProvider>
  );
}
