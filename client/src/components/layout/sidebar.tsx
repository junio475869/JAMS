import { useLocation } from "wouter";
import {
  Search,
  LayoutDashboard,
  ListChecks,
  FileText,
  Calendar,
  Mail,
  MessageSquare,
  ChartBar,
  BotIcon,
  SparklesIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string) => {
    setLocation(path);
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };

  const navItems = [
    { icon: <LayoutDashboard className="h-5 w-5 mr-3" />, label: 'Dashboard', path: '/' },
    { icon: <ListChecks className="h-5 w-5 mr-3" />, label: 'Applications', path: '/applications' },
    { icon: <FileText className="h-5 w-5 mr-3" />, label: 'Documents', path: '/documents' },
    { icon: <Calendar className="h-5 w-5 mr-3" />, label: 'Calendar', path: '/calendar' },
    { icon: <Mail className="h-5 w-5 mr-3" />, label: 'Email', path: '/email' },
    { icon: <MessageSquare className="h-5 w-5 mr-3" />, label: 'Interview Prep', path: '/interview' },
    { icon: <ChartBar className="h-5 w-5 mr-3" />, label: 'Analytics', path: '/analytics' }
  ];

  return (
    <aside className={cn(
      "bg-gray-850 border-r border-gray-700 transition-all duration-300 ease-in-out z-20",
      isOpen 
        ? "fixed inset-0 w-64 md:relative md:w-64 md:translate-x-0" 
        : "fixed -translate-x-full md:translate-x-0 md:relative md:w-64"
    )}>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input 
            type="text" 
            placeholder="Search applications..." 
            className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1">
        {navItems.map((item) => (
          <button 
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md",
              location === item.path
                ? "bg-primary-700 text-white"
                : "text-gray-300 hover:bg-gray-750 hover:text-white"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-3">
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
    </aside>
  );
}

export default Sidebar;
