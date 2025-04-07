import { useState } from 'react';
import { Moon, Sun, Palette, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/theme-context';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-400 hover:text-white hover:bg-gray-800">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-200">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem
          className={`hover:bg-gray-700 cursor-pointer focus:bg-gray-700 ${theme === 'dark-blue' ? 'bg-gray-700' : ''}`}
          onClick={() => {
            setTheme('dark-blue');
            setOpen(false);
          }}
        >
          <Moon className="h-4 w-4 mr-2 text-blue-400" />
          <span>Dark Blue</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          className={`hover:bg-gray-700 cursor-pointer focus:bg-gray-700 ${theme === 'dark-gray' ? 'bg-gray-700' : ''}`}
          onClick={() => {
            setTheme('dark-gray');
            setOpen(false);
          }}
        >
          <Moon className="h-4 w-4 mr-2 text-gray-400" />
          <span>Dark Gray</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          className={`hover:bg-gray-700 cursor-pointer focus:bg-gray-700 ${theme === 'dark-purple' ? 'bg-gray-700' : ''}`}
          onClick={() => {
            setTheme('dark-purple');
            setOpen(false);
          }}
        >
          <Moon className="h-4 w-4 mr-2 text-purple-400" />
          <span>Dark Purple</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          className={`hover:bg-gray-700 cursor-pointer focus:bg-gray-700 ${theme === 'light' ? 'bg-gray-700' : ''}`}
          onClick={() => {
            setTheme('light');
            setOpen(false);
          }}
        >
          <Sun className="h-4 w-4 mr-2 text-yellow-400" />
          <span>Light</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}