'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'pageindex-chat-settings';

export interface Settings {
  anthropicApiKey: string;
  pageindexApiUrl: string;
  pageindexApiKey: string;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (settings: Settings) => void;
  isConfigured: boolean;
  isLoaded: boolean;
  getHeaders: () => Record<string, string>;
}

const defaultSettings: Settings = {
  anthropicApiKey: '',
  pageindexApiUrl: 'https://chat.pageindex.ai',
  pageindexApiKey: '',
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // ignore storage errors
    }
  }, []);

  const isConfigured =
    !!settings.anthropicApiKey &&
    !!settings.pageindexApiUrl &&
    !!settings.pageindexApiKey;

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (settings.anthropicApiKey) {
      headers['x-anthropic-api-key'] = settings.anthropicApiKey;
    }
    if (settings.pageindexApiUrl) {
      headers['x-pageindex-api-url'] = settings.pageindexApiUrl;
    }
    if (settings.pageindexApiKey) {
      headers['x-pageindex-api-key'] = settings.pageindexApiKey;
    }
    return headers;
  }, [settings]);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, isConfigured, isLoaded, getHeaders }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
