import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  Mail,
  LineChart,
  ListChecks,
  UserCircle,
  LogOut,
  Users,
  Laptop,
  MessagesSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
  BotIcon,
  SparklesIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

export function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const baseNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/applications", label: "Applications", icon: ListChecks },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/interview", label: "Interview Prep", icon: MessagesSquare },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/email", label: "Email", icon: Mail },
    { href: "/analytics", label: "Analytics", icon: LineChart },
    { href: "/chat", label: "Chat", icon: MessagesSquare },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];
  const jobBidderItems = [
    { href: "/job-apply", label: "Job Apply", icon: Briefcase },
  ];
  const jobSeekerItems = [
    { href: "/job-apply", label: "Job Apply", icon: Briefcase },
  ];
  const groupManagerItems = [
    { href: "/team-management", label: "Team Management", icon: Users },
  ];
  const adminItems = [{ href: "/admin", label: "Admin", icon: Settings }];

  const getNavItems = () => {
    let items = [...baseNavItems];

    items = [...items, ...jobBidderItems];
    if ([UserRole.JOB_BIDDER].includes(user?.role as any)) return items;

    items = [...items, ...jobSeekerItems];
    if ([UserRole.JOB_SEEKER].includes(user?.role as any)) return items;

    items = [...items, ...groupManagerItems];
    if ([UserRole.GROUP_LEADER].includes(user?.role as any)) return items;

    items = [...items, ...adminItems];
    if ([UserRole.ADMIN].includes(user?.role as any)) return items;

    return items;
  };

  const navigationItems = getNavItems();

  const handleLogout = () => {
    if (localStorage.getItem("demoMode") === "true") {
      localStorage.removeItem("demoMode");
      window.location.href = "/auth";
    } else {
      logoutMutation.mutate();
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60",
        isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0",
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex items-center">
            <span className="font-bold text-xl">JAMS</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const isActive = item.href !== "/" && location.includes(item.href);
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full",
                  isActive
                    ? "bg-primary hover:bg-primary/90 text-white"
                    : "text-muted-foreground hover:bg-gray-500",
                  sidebarCollapsed
                    ? "px-2 justify-center"
                    : "px-4 justify-start",
                )}
                onClick={() => {
                  setLocation(item.href);
                  if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
              >
                <item.icon
                  className={cn("h-5 w-5", sidebarCollapsed ? "m-auto" : "")}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-1 border-t border-gray-700">
        <div className="rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BotIcon className="text-primary-500 h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white">AI Assistant</h3>
              <p className="text-xs text-gray-400">Optimize your job search</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full bg-gray-750 hover:bg-gray-700 text-gray-300 border-gray-700"
          >
            <SparklesIcon className="h-4 w-4 mr-1" /> Get suggestions
          </Button>
        </div>
      </div>
      {/* User Profile */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-none h-16",
                sidebarCollapsed ? "px-2" : "px-4",
              )}
            >
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture} alt={user?.username} />
                  <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")}>
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default Sidebar;
