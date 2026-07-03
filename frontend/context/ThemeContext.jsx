import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import config from '../config.js';
import { getToken, getStoredUser, isAuthenticated, setStoredUser } from '../utils/auth.js';

const ThemeContext = createContext(null);
const THEME_KEY = 'saas_theme';

const applyThemeClass = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const readLocalTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readLocalTheme());

  const setTheme = useCallback(async (nextTheme) => {
    const value = nextTheme === 'dark' ? 'dark' : 'light';
    setThemeState(value);
    applyThemeClass(value);
    localStorage.setItem(THEME_KEY, value);

    if (!isAuthenticated()) return;

    try {
      const token = getToken();
      const res = await fetch(`${config.api_url}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ theme: value }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const current = getStoredUser() || {};
        setStoredUser({
          ...current,
          preferences: data.user.preferences || { theme: value },
        });
      }
    } catch {
      // Local theme still applies if the API call fails
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const loadSavedTheme = async () => {
      if (!isAuthenticated()) return;

      const storedUser = getStoredUser();
      if (storedUser?.preferences?.theme) {
        const saved = storedUser.preferences.theme === 'dark' ? 'dark' : 'light';
        if (!cancelled) {
          setThemeState(saved);
          applyThemeClass(saved);
          localStorage.setItem(THEME_KEY, saved);
        }
      }

      try {
        const token = getToken();
        const res = await fetch(`${config.api_url}/user/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        const saved = data.user?.preferences?.theme === 'dark' ? 'dark' : 'light';
        if (cancelled) return;

        setThemeState(saved);
        applyThemeClass(saved);
        localStorage.setItem(THEME_KEY, saved);

        if (data.user) {
          setStoredUser({
            ...(getStoredUser() || {}),
            ...data.user,
            preferences: data.user.preferences || { theme: saved },
          });
        }
      } catch {
        // Keep local preference
      }
    };

    loadSavedTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
