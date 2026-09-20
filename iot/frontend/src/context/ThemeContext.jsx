import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('agrimate_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      // Default to dark as existing AgriMate design
      return 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('agrimate_theme', theme);
    } catch (e) {
      // ignore localStorage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
