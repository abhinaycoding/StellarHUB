import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Send, ArrowDownToLine, Activity, ArrowDownUp, Droplets, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

import { ExternalLink } from "lucide-react";

const coreItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Swap", href: "/swap", icon: ArrowDownUp },
  { name: "Pools", href: "/pools", icon: Droplets },
];

const actionItems = [
  { name: "Send", href: "/send", icon: Send },
  { name: "Receive", href: "/receive", icon: ArrowDownToLine },
  { name: "Mint", href: "/mint", icon: Sparkles },
  { name: "Transactions", href: "/transactions", icon: Activity },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-surface border-r border-border hidden md:flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <Star className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-bold text-text-primary tracking-tight">
            StellarHub
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Core
          </div>
          <nav className="space-y-1">
            {coreItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-text-secondary hover:text-text-primary hover:bg-surface font-medium"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary")} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Actions
          </div>
          <nav className="space-y-1">
            {actionItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-text-secondary hover:text-text-primary hover:bg-surface font-medium"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary")} />
                  <span className="text-sm">{item.name}</span>
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
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-2 rounded-md hover:bg-surface"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Stellar Documentation
        </a>
      </div>
    </div>
  );
}
