'use client';

import { UserStats } from '@/lib/types';
import { motion } from 'framer-motion';
import { Trophy, Target, Award } from 'lucide-react';

interface StatsCardProps {
  stats: UserStats;
}

export const StatsCard = ({ stats }: StatsCardProps) => {
  const total = stats.easy + stats.medium + stats.hard; // Recalculate total if needed or use stats.totalSolved

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'emerald';
      case 'Medium': return 'yellow';
      case 'Hard': return 'rose';
      default: return 'zinc';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg hover:border-zinc-700 transition-all group"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {stats.platform}
          </h2>
          <p className="text-zinc-500 text-xs mt-1">@{stats.username}</p>
        </div>
        <div className={`p-2 rounded-lg bg-zinc-800/50 group-hover:scale-110 transition-transform duration-300`}>
           {/* Dynamic Icon based on platform could go here, generic for now */}
           <Trophy className="w-5 h-5 text-zinc-400" />
        </div>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <span className="text-4xl font-bold text-white tracking-tight">
          {stats.totalSolved}
        </span>
        <span className="text-sm text-zinc-500 mb-1.5 font-medium">solved</span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {[
          { label: 'Easy', count: stats.easy, color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Medium', count: stats.medium, color: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Hard', count: stats.hard, color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-400">{item.label}</span>
              <span className={item.text}>{item.count}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full ${item.color} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Stats like Ranking */}
      <div className="mt-6 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4">
         <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Ranking</span>
            <div className="text-sm font-medium text-zinc-300 mt-0.5">
            {(stats.ranking ?? 0) > 0 ? (stats.ranking!).toLocaleString() : 'N/A'}            </div>
         </div>
         {/* Placeholder for future goal/streak specific to platform if available */}
      </div>
    </motion.div>
  );
};
