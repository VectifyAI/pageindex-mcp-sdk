'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'pageindex-chat-settings';

export type Provider = 'anthropic' | 'openrouter';

export interface Settings {
  pageindexApiUrl: string;
  pageindexApiKey: string;
  folderScope?: string;

  provider: Provider;

  // Anthropic config
  anthropicApiKey: string;
  anthropicModel: string;

  // OpenRouter config
  openrouterApiKey: string;
  openrouterModel: string;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (settings: Settings) => void;
  isConfigured: boolean;
  isLoaded: boolean;
  getHeaders: () => Record<string, string>;
}

const defaultSettings: Settings = {
  pageindexApiUrl: 'https://chat.pageindex.ai',
  pageindexApiKey: '',
  provider: 'anthropic',
  anthropicApiKey: '',
  anthropicModel: 'claude-sonnet-4-5-20250929',
  openrouterApiKey: '',
  openrouterModel: 'anthropic/claude-opus-4.5',
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

  const isProviderConfigured =
    settings.provider === 'anthropic'
      ? !!settings.anthropicApiKey
      : !!settings.openrouterApiKey;

  const isConfigured =
    isProviderConfigured && !!settings.pageindexApiUrl && !!settings.pageindexApiKey;

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {};

    headers['x-provider'] = settings.provider;

    if (settings.provider === 'anthropic') {
      if (settings.anthropicApiKey) {
        headers['x-anthropic-api-key'] = settings.anthropicApiKey;
      }
      if (settings.anthropicModel) {
        headers['x-anthropic-model'] = settings.anthropicModel;
      }
    } else {
      if (settings.openrouterApiKey) {
        headers['x-openrouter-api-key'] = settings.openrouterApiKey;
      }
      if (settings.openrouterModel) {
        headers['x-openrouter-model'] = settings.openrouterModel;
      }
    }

    if (settings.pageindexApiUrl) {
      headers['x-pageindex-api-url'] = settings.pageindexApiUrl;
    }
    if (settings.pageindexApiKey) {
      headers['x-pageindex-api-key'] = settings.pageindexApiKey;
    }
    if (settings.folderScope) {
      headers['x-folder-scope'] = settings.folderScope;
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
