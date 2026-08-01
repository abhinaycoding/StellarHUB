import { useState, useRef, useEffect } from "react";
import { Bell, Search, Sun, Moon, Menu, Wallet, Check, CheckCircle2, Info, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotification, type NotificationType } from "@/contexts/NotificationContext";

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'error': return <XCircle className="w-4 h-4 text-error" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'info':
    default: return <Info className="w-4 h-4 text-primary" />;
  }
};

export function TopNav() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addNotification } = useNotification();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-50">
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
        
        {/* Notifications Hub */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg transition-colors relative ${showNotifications ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse border border-surface"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 backdrop-blur-3xl bg-surface/80 border border-white/5 rounded-[24px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden flex flex-col max-h-[80vh] transform transition-all origin-top-right animate-in fade-in zoom-in-95 duration-300">
              
              {/* Header with gradient bottom border */}
              <div className="relative p-5 flex justify-between items-center bg-white/[0.02]">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2.5 tracking-tight">
                   <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 shadow-[0_0_15px_rgba(var(--color-primary),0.2)]">
                     <Bell className="w-4 h-4 text-primary" /> 
                   </div>
                   Notifications
                </h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-white transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10"
                    >
                      <Check className="w-3 h-3" /> Read All
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearAll}
                      className="text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-error transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-error/10"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-1 relative">
                {notifications.length === 0 ? (
                  <div className="relative p-12 text-center flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                    {/* Background glow for empty state */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--color-primary),0.08)_0%,transparent_70%)] pointer-events-none"></div>
                    
                    <div className="relative w-20 h-20 rounded-full flex items-center justify-center mb-6">
                       <div className="absolute inset-0 border border-primary/30 rounded-full animate-ping opacity-20"></div>
                       <div className="absolute inset-2 border border-primary/20 rounded-full animate-pulse opacity-40"></div>
                       <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-surface to-background border border-white/10 rounded-full flex items-center justify-center shadow-xl">
                         <Bell className="w-5 h-5 text-text-secondary" />
                       </div>
                    </div>
                    
                    <p className="text-lg font-extrabold text-white tracking-tight mb-1">You're all caught up!</p>
                    <p className="text-sm text-text-secondary/80">No new alerts or transactions.</p>
                    
                    {/* Premium Dev helper to test */}
                    <button 
                      onClick={() => addNotification('Stellar Hub Upgraded', 'Experience the new ultra-premium notifications UI.', 'success')} 
                      className="relative overflow-hidden mt-8 text-xs font-bold text-black transition-all flex items-center gap-2 px-6 py-2.5 rounded-full group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-transform duration-300 group-hover:scale-105"></div>
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                        Trigger Demo Notification
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => !notif.read && markAsRead(notif.id)}
                        className={`relative mx-2 mb-2 p-4 flex gap-4 transition-all duration-300 cursor-pointer rounded-2xl group overflow-hidden ${
                          !notif.read 
                             ? 'bg-gradient-to-r from-primary/[0.08] to-transparent border border-primary/20 shadow-[0_4px_20px_-4px_rgba(var(--color-primary),0.15)]' 
                             : 'hover:bg-white/[0.03] border border-transparent hover:border-white/5'
                        }`}
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        <div className="relative shrink-0 mt-0.5 flex items-center justify-center w-10 h-10 rounded-xl bg-background border border-white/5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                          {getIconForType(notif.type)}
                        </div>
                        
                        <div className="relative flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <p className={`text-sm font-bold truncate transition-colors ${!notif.read ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-text-secondary/50 uppercase tracking-widest font-mono shrink-0 whitespace-nowrap mt-0.5 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/5">
                              {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          <p className={`text-xs line-clamp-2 leading-relaxed ${!notif.read ? 'text-text-primary/90' : 'text-text-secondary/70'}`}>
                            {notif.message}
                          </p>
                        </div>
                        
                        {!notif.read && (
                          <div className="shrink-0 flex items-center justify-center pl-2">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_12px_var(--color-primary)] ring-2 ring-primary/20 animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
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
