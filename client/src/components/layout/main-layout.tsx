
import React, { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Mail,
  LineChart,
  Briefcase,
  UserCircle,
  Menu,
  MessageSquare,
  LogOut,
  X,
  Users,
  Search,
  Laptop,
  MessagesSquare
} from "lucide-react";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check for demo mode
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  // Base navigation items
  const baseNavigationItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/applications", label: "Applications", icon: Briefcase },
    { href: "/job-apply", label: "Apply for Jobs", icon: Laptop },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/interview", label: "Interview Prep", icon: MessageSquare },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/email", label: "Email", icon: Mail },
    { href: "/analytics", label: "Analytics", icon: LineChart },
    { href: "/chat", label: "Chat", icon: MessagesSquare },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];
  
  // Create admin-specific navigation items
  let navigationItems = [...baseNavigationItems];
  
  // Add team management for admin and group leader users
  if (user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER) {
    navigationItems.push({ 
      href: "/team-management", 
      label: "Team Management", 
      icon: Users 
    });
  }

  const handleLogout = () => {
    if (isDemoMode) {
      localStorage.removeItem("demoMode");
      window.location.href = "/auth";
    } else {
      logoutMutation.mutate();
    }
  };

  // Mobile sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out md:relative md:flex main-layout-sidebar`}
        >
          <div className="flex flex-col h-full w-full border-r">
            <div className="flex items-center justify-between p-4 bg-[var(--card)]">
              <div className="font-bold text-xl text-foreground">JAMS</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="md:hidden text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isDemoMode && (
              <div className="mx-4 mt-4 mb-2 p-2 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-xs text-blue-300 font-medium">Demo Mode</p>
              </div>
            )}
            
            <div className="px-4 pt-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/50" />
                <Input
                  type="search"
                  placeholder="Search applications..."
                  className="pl-8 bg-[var(--sidebar-item-hover)] border-[var(--border)] text-sm"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 py-4">
              <nav className="space-y-1 px-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={`w-full justify-start ${
                        isActive 
                          ? "sidebar-item-active text-foreground" 
                          : "text-foreground/70 sidebar-item hover:text-foreground"
                      }`}
                      onClick={() => {
                        setLocation(item.href);
                        if (sidebarOpen) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </ScrollArea>

            <div className="p-4 bg-[var(--card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium mr-2">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium truncate text-foreground">
                      {isDemoMode
                        ? "Demo User"
                        : user?.fullName || user?.username || "User"}
                    </div>
                    <div className="text-xs text-foreground/60 truncate">
                      {isDemoMode ? "demo@example.com" : user?.email || "user@example.com"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                  className="text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          {/* Mobile header with menu button */}
          <div className="md:hidden flex items-center p-4 main-layout-header border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2 text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-bold text-lg text-foreground">JAMS</div>
          </div>
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
}
