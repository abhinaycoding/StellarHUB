import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Holder } from '../../types/leaderboard';

interface LeaderboardTableProps {
  holders: Holder[];
  isLoading: boolean;
  pageSize?: number;
}

export function LeaderboardTable({ holders, isLoading, pageSize = 10 }: LeaderboardTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) {
    return null; // Handled by Skeleton at page level
  }

  if (holders.length === 0) {
    return (
      <div className="bg-surface border border-border p-12 text-center">
        <div className="text-text-secondary font-mono mb-2">NO HOLDER DATA</div>
        <div className="text-sm text-text-secondary">The selected token has no indexed holders yet.</div>
      </div>
    );
  }

  const totalPages = Math.ceil(holders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentHolders = holders.slice(startIndex, endIndex);

  return (
    <div className="bg-surface border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Rank</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Holder</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-right whitespace-nowrap">Balance</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-right whitespace-nowrap">Ownership</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-widest text-right whitespace-nowrap">Last Activity</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {currentHolders.map((holder, idx) => {
              const globalIdx = startIndex + idx;
              return (
                <tr 
                  key={holder.address} 
                  className={`border-b border-border/30 hover:bg-background/50 transition-colors ${globalIdx === 0 ? 'bg-primary/5' : ''}`}
                >
                  <td className="p-4">
                    <span className={`px-2 py-1 ${globalIdx === 0 ? 'bg-primary text-background font-bold' : 'text-text-secondary'}`}>
                      #{holder.rank}
                    </span>
                  </td>
                  <td className="p-4 text-text-primary">
                    <div className="truncate w-32 md:w-auto" title={holder.address}>
                      {holder.address}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-text-primary">
                    {holder.balance.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-text-secondary">
                    {holder.ownershipPercentage.toFixed(2)}%
                  </td>
                  <td className="p-4 text-right text-text-secondary text-xs">
                    {new Date(holder.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between text-sm">
          <div className="text-text-secondary font-mono">
            Showing {startIndex + 1}-{Math.min(endIndex, holders.length)} of {holders.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-border hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
