import React, { createContext, useContext, useState, useEffect } from 'react';

type NetworkType = 'mainnet' | 'testnet' | 'futurenet';
type CurrencyType = 'USD' | 'EUR' | 'GBP';

interface Settings {
  network: NetworkType;
  displayCurrency: CurrencyType;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  network: 'testnet',
  displayCurrency: 'USD',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('stellar-hub-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings from local storage', e);
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('stellar-hub-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
