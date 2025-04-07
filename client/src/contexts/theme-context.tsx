import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'dark-blue' | 'dark-gray' | 'dark-purple' | 'light';
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const defaultContext: ThemeContextType = {
  theme: 'dark-blue',
  setTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage
    const savedTheme = localStorage.getItem('jams-theme') as Theme;
    return savedTheme || 'dark-blue';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('jams-theme', theme);
    
    // Apply theme to HTML element
    const root = window.document.documentElement;
    
    // Remove all previous theme classes
    root.classList.remove('theme-dark-blue', 'theme-dark-gray', 'theme-dark-purple', 'theme-light');
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Update the appearance in theme.json via CSS variables
    if (theme === 'light') {
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--foreground', '#020817');
    } else if (theme === 'dark-blue') {
      document.documentElement.style.setProperty('--background', '#0f172a');
      document.documentElement.style.setProperty('--foreground', '#f8fafc');
    } else if (theme === 'dark-gray') {
      document.documentElement.style.setProperty('--background', '#111827');
      document.documentElement.style.setProperty('--foreground', '#f9fafb');
    } else if (theme === 'dark-purple') {
      document.documentElement.style.setProperty('--background', '#1e1b4b');
      document.documentElement.style.setProperty('--foreground', '#f5f3ff');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};