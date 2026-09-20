import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ 
  className = "", 
  variant = "button", // "button" | "pill" | "segmented"
  showLabel = false 
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === "segmented") {
    return (
      <div className={`flex items-center p-1 bg-secondary/50 rounded-2xl border border-border ${className}`}>
        <button
          type="button"
          onClick={() => isDark && toggleTheme()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            !isDark 
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-amber-600 dark:text-amber-400' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sun size={14} className={!isDark ? "text-amber-500" : ""} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => !isDark && toggleTheme()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isDark 
              ? 'bg-card text-foreground shadow-sm border border-border/80 text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Moon size={14} className={isDark ? "text-primary" : ""} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-xl border border-border transition-all active:scale-95 group ${className}`}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle theme"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute"
              >
                <Moon size={14} className="text-primary group-hover:rotate-12 transition-transform" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute"
              >
                <Sun size={14} className="text-amber-500 group-hover:rotate-45 transition-transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {showLabel && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            {isDark ? "Dark" : "Light"}
          </span>
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-10 h-10 flex items-center justify-center rounded-xl bg-secondary/50 hover:bg-secondary text-foreground border border-border transition-all active:scale-95 group ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={18} className="text-primary group-hover:scale-110 transition-transform" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={18} className="text-amber-500 group-hover:rotate-45 transition-transform" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
