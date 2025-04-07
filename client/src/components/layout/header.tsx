import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  BriefcaseIcon,
  BellIcon,
  HelpCircleIcon,
  MenuIcon,
  PlusIcon,
  UserIcon
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // If in demo mode, just clear localStorage and redirect to auth page
    if (localStorage.getItem("demoMode") === "true") {
      localStorage.removeItem("demoMode");
      setLocation("/auth");
      return;
    }
    
    // Otherwise, use the regular logout
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.username?.substring(0, 2)?.toUpperCase() || 'U';
  };

  // Check if in demo mode
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  return (
    <header className="main-layout-header border-b shadow-md">
      {isDemoMode && (
        <div className="bg-blue-900/60 text-blue-200 text-center py-1 px-4 text-sm border-b border-blue-800">
          Demo Mode - Changes are not saved to the database
        </div>
      )}
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center py-3 px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <button 
              type="button" 
              onClick={toggleSidebar}
              className="md:hidden text-foreground/70 hover:text-foreground"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <a href="/" className="flex items-center" onClick={(e) => {e.preventDefault(); setLocation('/');}}>
              <div className="bg-primary/20 text-primary p-1.5 rounded">
                <BriefcaseIcon className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-semibold text-foreground">JAMS</span>
            </a>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--sidebar-item-hover)] text-foreground"
              onClick={() => setLocation('/applications')}
            >
              <PlusIcon className="h-4 w-4 mr-1" /> New Application
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)] relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-primary text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]">
              <HelpCircleIcon className="h-5 w-5" />
            </Button>
            <ThemeSwitcher />
          </div>
          
          <div className="flex items-center">
            <div className="relative ml-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-1 focus:ring-primary hover:bg-[var(--sidebar-item-hover)]"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                      {getUserInitials()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)] text-foreground">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--border)]" />
                  <DropdownMenuItem 
                    className="hover:bg-[var(--sidebar-item-hover)] cursor-pointer focus:bg-[var(--sidebar-item-hover)]"
                    onClick={() => setLocation('/profile')}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="hover:bg-[var(--sidebar-item-hover)] cursor-pointer focus:bg-[var(--sidebar-item-hover)]"
                    onClick={handleLogout}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
