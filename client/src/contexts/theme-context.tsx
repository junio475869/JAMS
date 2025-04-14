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
    const themeColors = {
      'light': {
        background: '#ffffff',
        foreground: '#020817',
        secondary: '#f1f5f9',
        'secondary-foreground': '#020817',
        muted: '#f1f5f9',
        'muted-foreground': '#64748b',
        accent: '#f8fafc',
        'accent-foreground': '#020817',
      },
      'dark-blue': {
        background: '#0f172a',
        foreground: '#f8fafc',
        secondary: '#1e293b',
        'secondary-foreground': '#f8fafc',
        muted: '#334155',
        'muted-foreground': '#94a3b8',
        accent: '#1e293b',
        'accent-foreground': '#f8fafc',
      },
      'dark-gray': {
        background: '#111827',
        foreground: '#f9fafb',
        secondary: '#1f2937',
        'secondary-foreground': '#f9fafb',
        muted: '#374151',
        'muted-foreground': '#9ca3af',
        accent: '#1f2937',
        'accent-foreground': '#f9fafb',
      },
      'dark-purple': {
        background: '#1e1b4b',
        foreground: '#f5f3ff',
        secondary: '#312e81',
        'secondary-foreground': '#f5f3ff',
        muted: '#4338ca',
        'muted-foreground': '#a5b4fc',
        accent: '#312e81',
        'accent-foreground': '#f5f3ff',
      }
    };

    const colors = themeColors[theme as keyof typeof themeColors];
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};