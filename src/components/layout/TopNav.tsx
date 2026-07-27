import { Bell, Search, Sun, Moon, Menu, Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";

export function TopNav() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border focus-within:border-white/20 transition-colors">
          <Search className="w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="bg-transparent border-none outline-none text-sm w-48 text-text-primary placeholder:text-text-secondary"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-black/5 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></span>
        </button>
        
        <div className="h-4 w-px bg-border mx-2"></div>

        {address ? (
          <button 
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border hover:bg-white/5 transition-colors"
            title="Disconnect"
          >
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
              <Wallet className="w-3 h-3 text-text-primary" />
            </div>
            <span className="text-sm font-medium text-text-primary">
              {address.slice(0, 4)}...{address.slice(-4)}
            </span>
          </button>
        ) : (
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-2 bg-white hover:bg-white/90 text-black px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
          >
            <Wallet className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
