/**
 * ThemeProvider — applies the active theme by injecting CSS custom properties
 * into :root. Free users are locked to the default "dark" theme (already
 * defined in index.css). Premium users can select any PREMIUM_THEMES entry.
 *
 * The theme is stored in UserPreferences and synced here.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  FREE_THEME,
  PREMIUM_THEMES,
  THEMES,
  themeToCSS,
  type ThemeId,
} from '@shared/types/theme';
import type { UserPlan } from '@shared/types/user';

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId, plan: UserPlan) => void;
  availableThemes: ThemeId[];
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem('gym_theme') as ThemeId | null) ?? FREE_THEME;
  });

  // Apply theme tokens to :root whenever themeId changes
  useEffect(() => {
    const tokens = THEMES[themeId];
    if (!tokens) return;
    const styleId = 'gymtracker-theme';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `:root { ${themeToCSS(tokens)} }`;
    localStorage.setItem('gym_theme', themeId);
  }, [themeId]);

  const setTheme = (id: ThemeId, plan: UserPlan) => {
    if (id !== FREE_THEME && !PREMIUM_THEMES.includes(id)) return;
    if (id !== FREE_THEME && plan !== 'premium') return; // silently ignore
    setThemeId(id);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        setTheme,
        availableThemes: [FREE_THEME, ...PREMIUM_THEMES],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
