import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Send, ArrowDownToLine, Activity, ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Swap", href: "/swap", icon: ArrowDownUp },
  { name: "Send", href: "/send", icon: Send },
  { name: "Receive", href: "/receive", icon: ArrowDownToLine },
  { name: "Transactions", href: "/transactions", icon: Activity },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-background border-r border-border hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            StellarHub
          </span>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                isActive 
                  ? "bg-surface text-white border border-border/50" 
                  : "text-text-secondary hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-text-secondary group-hover:text-white")} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
