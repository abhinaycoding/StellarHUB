import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative z-0">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
