import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Send, ArrowDownToLine, Activity, ArrowDownUp, Droplets, Sparkles, Star, Trophy, Server, Book, Settings, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { ExternalLink } from "lucide-react";

const coreItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Network Metrics", href: "/network", icon: Server },
  { name: "Token Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Swap", href: "/swap", icon: ArrowDownUp },
  { name: "Pools", href: "/pools", icon: Droplets },
];

const actionItems = [
  { name: "Send", href: "/send", icon: Send },
  { name: "Receive", href: "/receive", icon: ArrowDownToLine },
  { name: "NFTs", href: "/nfts", icon: ImageIcon },
  { name: "Mint Tokens", href: "/mint", icon: Sparkles },
  { name: "Transactions", href: "/transactions", icon: Activity },
];

const preferenceItems = [
  { name: "Address Book", href: "/address-book", icon: Book },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-surface border-r border-border hidden md:flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary rounded-sm flex items-center justify-center bg-background">
            <Star className="w-3.5 h-3.5 text-primary fill-current" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight font-mono">
            StellarHub
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 space-y-8">
        <div>
          <div className="px-6 mb-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Core
          </div>
          <nav className="flex flex-col">
            {coreItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-2 transition-colors border-l-2",
                    isActive 
                      ? "border-primary text-text-primary bg-background/50" 
                      : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/30"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-secondary")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-6 mb-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Actions
          </div>
          <nav className="flex flex-col">
            {actionItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-2 transition-colors border-l-2",
                    isActive 
                      ? "border-primary text-text-primary bg-background/50" 
                      : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/30"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-secondary")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div>
          <div className="px-6 mb-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Preferences
          </div>
          <nav className="flex flex-col">
            {preferenceItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-2 transition-colors border-l-2",
                    isActive 
                      ? "border-primary text-text-primary bg-background/50" 
                      : "border-transparent text-text-secondary hover:text-text-primary hover:bg-background/30"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-secondary")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <a 
          href="https://developers.stellar.org/docs" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2 border border-transparent hover:border-border"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Stellar Documentation
        </a>
      </div>
    </div>
  );
}
