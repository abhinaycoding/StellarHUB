export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Holders Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface border border-border p-4 h-32 flex flex-col justify-between">
            <div className="h-4 bg-border/50 w-24 rounded-sm"></div>
            <div className="space-y-2">
              <div className="h-3 bg-border/30 w-32 rounded-sm"></div>
              <div className="h-5 bg-border/40 w-20 rounded-sm"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-surface border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2 text-text-secondary font-mono text-sm">
          <span className="w-4 h-4 rounded-full bg-border/50 inline-block animate-pulse" />
          SYNCING CONTRACT STATE...
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30">
                <div className="flex items-center gap-4 w-1/2">
                  <div className="h-4 bg-border/50 w-8 rounded-sm"></div>
                  <div className="h-4 bg-border/30 w-32 rounded-sm"></div>
                </div>
                <div className="flex items-center justify-between w-1/2">
                  <div className="h-4 bg-border/40 w-24 rounded-sm"></div>
                  <div className="h-4 bg-border/30 w-16 rounded-sm"></div>
                  <div className="h-4 bg-border/20 w-20 rounded-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
