'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingBackground } from '@/components/Dashboard/FloatingBackground';
import { Terminal, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { UnifiedHeatmap } from '@/components/Dashboard/UnifiedHeatmap';
import { ContestList } from '@/components/Dashboard/ContestList';
import { StreakCard } from '@/components/Dashboard/StreakCard';
import { AnalyticsCharts } from '@/components/Dashboard/AnalyticsCharts';
import { UserStats, Contest } from '@/lib/types';
import clsx from 'clsx';

export default function Home() {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setContests(data.contests || []);
        setLastUpdated(new Date(data.lastUpdated).toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans selection:bg-emerald-500/30 relative">
      <FloatingBackground />
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800/60 pb-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl ring-1 ring-emerald-500/20">
              <Terminal className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
                project<span className="text-emerald-500">Dashboard</span>
              </h1>
              <p className="text-zinc-500 text-sm font-medium">Real-time competitive programming analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {lastUpdated && <span className="text-xs text-zinc-500 hidden sm:block font-mono">Synced: {lastUpdated}</span>}
            <button
              onClick={fetchData}
              disabled={loading}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg font-bold text-sm hover:bg-white hover:scale-105 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                loading && "opacity-80"
              )}
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              {loading ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Greeting Section */}
        <div className="space-y-1">
           <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
             Hey Coder! 👋
           </h2>
           <p className="text-zinc-400">Here is your daily progress report.</p>
        </div>

        {/* Stats Grid with Streak Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading && stats.length === 0 ? (
             // Skeletons
             [...Array(4)].map((_, i) => (
               <div key={i} className="h-48 bg-zinc-900/50 rounded-xl border border-zinc-900 animate-pulse" />
             ))
          ) : (
            <>
              <StreakCard stats={stats} />
              {stats.map((stat, idx) => (
                <StatsCard key={idx} stats={stat} />
              ))}
            </>
          )}
        </div>

        {/* Full Width Heatmap */}
        <div>
           {stats.length > 0 ? (
             <UnifiedHeatmap stats={stats} />
           ) : (
             <div className="h-64 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse" />
           )}
        </div>

        {/* Analytics & Contests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Analytics Charts (2/3 width) */}
           <div className="lg:col-span-2">
              {stats.length > 0 && !loading && (
                 <AnalyticsCharts stats={stats} />
              )}
           </div>
           
           {/* Upcoming Contests (1/3 width) */}
           <div className="h-full">
              <ContestList contests={contests} />
           </div>
        </div>
      </div>
    </div>
  );
}
