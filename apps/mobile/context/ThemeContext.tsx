import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_THEME, PREMIUM_THEMES, THEMES, type ThemeId, type ThemeTokens } from '@shared/types/theme';

const STORAGE_KEY = 'gym_theme';

interface ThemeState {
  themeId: ThemeId;
  theme: ThemeTokens;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeState>({
  themeId: FREE_THEME,
  theme: THEMES[FREE_THEME],
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(FREE_THEME);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setThemeId(v as ThemeId); })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    void AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, theme: THEMES[themeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { FREE_THEME, PREMIUM_THEMES };
export type { ThemeId };
