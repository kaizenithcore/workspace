"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  FolderKanban,
  Tag,
  CheckSquare,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDataStore } from "@/lib/hooks/use-data-store";
import { useI18n } from "@/lib/hooks/use-i18n";
import { signOut } from "@/lib/auth";
import type { Project, Category } from "@/lib/types";
import { useUser } from "@/lib/firebase/hooks";
import { getUserDocument, UserDocument } from "@/lib/firestore-user";

interface HeaderProps {
  className?: string;
  projects?: Project[];
  categories?: Category[];
  currentProject?: Project | null;
  currentCategory?: Category | null;
  onProjectChange?: (project: Project | null) => void;
  onCategoryChange?: (category: Category | null) => void;
}

export function Header({
  className,
  projects = [],
  categories = [],
  currentProject,
  currentCategory,
  onProjectChange,
  onCategoryChange,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { t } = useI18n();
  const {
    tasks,
    events,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useDataStore();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const predefinedNotifications = notifications; // Declare predefinedNotifications here
  const { user: authUser } = useUser();
  const [userDoc, setUserDoc] = React.useState<UserDocument | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadUserDoc() {
      try {
        const doc = await getUserDocument(authUser!.uid);
        if (mounted) {
          setUserDoc(doc);
          setLoading(false);
        }
      } catch (error) {
        console.error("[Header] Failed to load user document:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUserDoc();

    return () => {
      mounted = false;
    };
  }, [authUser]);

  const handleNotificationClick = (notificationId: string, href?: string) => {
    markNotificationAsRead(notificationId);
    if (href) {
      router.push(href);
      setNotificationsOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("[Header] Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const formatNotificationTime = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { tasks: [], events: [], projects: [] };
    const query = searchQuery.toLowerCase();
    return {
      tasks: tasks
        .filter((t) => t.title.toLowerCase().includes(query))
        .slice(0, 5),
      events: events
        .filter((e) => e.title.toLowerCase().includes(query))
        .slice(0, 5),
      projects: projects
        .filter((p) => p.name.toLowerCase().includes(query))
        .slice(0, 5),
    };
  }, [searchQuery, tasks, events, projects]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-md px-4 lg:px-6",
        className,
      )}
    >
      {/* Left: Logo and Selectors */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {/* Kaizenith monogram — hex/diamond container with N */}
          <img src="/icon.png" alt="Kaizenith Logo" className="h-6 w-6" />
          <span className="hidden font-semibold tracking-brand uppercase text-sm lg:inline-block">
            kaizenith workspace
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: currentProject?.color || "#6B7280" }}
              />
              <span className="hidden sm:inline-block">
                {currentProject?.name || t("allProjects")}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t("projects")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onProjectChange?.(null)}
              className="gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              {t("allProjects")}
            </DropdownMenuItem>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onProjectChange?.(project)}
                className="gap-2"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="gap-2"
            >
              <FolderKanban className="h-4 w-4" />
              {t("manageProjects")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
            >
              <Tag
                className="h-3 w-3"
                style={{ color: currentCategory?.color || "#6B7280" }}
              />
              <span className="hidden sm:inline-block">
                {currentCategory?.name || t("allCategories")}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t("categories")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCategoryChange?.(null)}
              className="gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              {t("allCategories")}
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => onCategoryChange?.(category)}
                className="gap-2"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              {t("manageCategories")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 justify-center px-4 max-w-md">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground bg-muted/50 border-0"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span>{t("globalSearch")}</span>
          <kbd className="ml-auto pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label={t("toggleSearch")}
        >
          <Search className="h-5 w-5" />
        </Button>

        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={t("notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="font-semibold">{t("notifications")}</h4>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllNotificationsAsRead}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Mark all read
                    </Button>
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("noNotifications")}
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.action?.href,
                      )
                    }
                    className={cn(
                      "flex items-start gap-3 border-b p-4 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.read && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "h-2 w-2 mt-2 rounded-full shrink-0",
                        notification.read ? "bg-muted" : "bg-primary",
                      )}
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                        {notification.action && (
                          <span className="text-xs text-primary">
                            {notification.action.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={t("toggleTheme")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userDoc?.profile?.avatarUrl || "/placeholder.svg"}
                  alt={userDoc?.name || "User"}
                />
                <AvatarFallback>
                  {userDoc?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {userDoc?.name || t("guest")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userDoc?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="gap-2">
                <User className="h-4 w-4" />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="gap-2">
                <Settings className="h-4 w-4" />
                {t("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? "Signing out..." : t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-xl p-0">
          <Command className="rounded-lg border-0">
            <CommandInput
              placeholder={t("globalSearch")}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{t("noResults")}</CommandEmpty>
              {searchResults.tasks.length > 0 && (
                <CommandGroup heading={t("searchResultsTasks")}>
                  {searchResults.tasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      onSelect={() => {
                        router.push("/tasks");
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      {task.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults.events.length > 0 && (
                <CommandGroup heading={t("searchResultsEvents")}>
                  {searchResults.events.map((event) => (
                    <CommandItem
                      key={event.id}
                      onSelect={() => {
                        router.push("/agenda");
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {event.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchResults.projects.length > 0 && (
                <CommandGroup heading={t("searchResultsProjects")}>
                  {searchResults.projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      onSelect={() => {
                        onProjectChange?.(project);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {project.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </header>
  );
}
