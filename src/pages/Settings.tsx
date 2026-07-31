import { useSettings } from "@/contexts/SettingsContext";
import { Settings as SettingsIcon, Globe, DollarSign } from "lucide-react";

export function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-text-secondary mt-1">Manage your application preferences</p>
      </div>

      <div className="space-y-6">
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Network Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Default Network</h3>
                <p className="text-sm text-text-secondary mt-1">Choose which Stellar network to connect to by default.</p>
              </div>
              <select
                value={settings.network}
                onChange={(e) => updateSettings({ network: e.target.value as any })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
                <option value="futurenet">Futurenet</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Display Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Display Currency</h3>
                <p className="text-sm text-text-secondary mt-1">Choose the fiat currency used to estimate asset values.</p>
              </div>
              <select
                value={settings.displayCurrency}
                onChange={(e) => updateSettings({ displayCurrency: e.target.value as any })}
                className="bg-background border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
