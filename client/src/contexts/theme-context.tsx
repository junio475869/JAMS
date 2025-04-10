
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'dark-blue' | 'dark-gray' | 'dark-purple' | 'light-modern';
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
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark-blue';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-dark-blue', 'theme-dark-gray', 'theme-dark-purple', 'theme-light-modern');
    root.classList.add(`theme-${theme}`);
    
    // Update CSS variables based on theme
    switch(theme) {
      case 'light-modern':
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#020817');
        break;
      case 'dark-blue':
        root.style.setProperty('--background', '#0f172a');
        root.style.setProperty('--foreground', '#f8fafc');
        break;
      case 'dark-gray':
        root.style.setProperty('--background', '#111827');
        root.style.setProperty('--foreground', '#f9fafb');
        break;
      case 'dark-purple':
        root.style.setProperty('--background', '#1e1b4b');
        root.style.setProperty('--foreground', '#f5f3ff');
        break;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
