'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { UserStats } from '@/lib/types';
import { format, subDays, eachDayOfInterval, subMonths } from 'date-fns';
import { enhanceStatsWithAutoActivity } from '@/lib/heatmapSync';

interface StreakCardProps {
  stats: UserStats[];
}

export const StreakCard = ({ stats }: StreakCardProps) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [streakAlive, setStreakAlive] = useState(false);
  const [daysUntilMilestone, setDaysUntilMilestone] = useState<number | null>(null);
  const [nextMilestone, setNextMilestone] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'current' | 'max'>('current');

  // Auto-enhance stats with detected activity changes (same as heatmap and charts)
  const enhancedStats = useMemo(() => {
    if (stats.length === 0) return stats;
    return enhanceStatsWithAutoActivity(stats);
  }, [stats]);

  useEffect(() => {
    // Calculate unified activity map using enhanced stats
    const activityMap = new Map<string, number>();
    enhancedStats.forEach((stat) => {
      if (stat.history) {
        stat.history.forEach((day) => {
          const count = activityMap.get(day.date) || 0;
          activityMap.set(day.date, count + day.count);
        });
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date();
    const start = subMonths(end, 12);
    const activeDatesSet = new Set(Array.from(activityMap.keys()));

    // Calculate max streak
    let maxStreakCount = 0;
    let tempStreak = 0;
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (activeDatesSet.has(dateStr)) {
        tempStreak++;
        maxStreakCount = Math.max(maxStreakCount, tempStreak);
      } else {
        tempStreak = 0;
      }
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate current streak
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    let currentStreakCount = 0;
    const hasActivityToday = activeDatesSet.has(todayStr);
    const hasActivityYesterday = activeDatesSet.has(yesterdayStr);

    if (hasActivityToday || hasActivityYesterday) {
      let checkDate = hasActivityToday ? new Date(today) : subDays(today, 1);
      while (checkDate >= start) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (activeDatesSet.has(dateStr)) {
          currentStreakCount++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
    }

    setCurrentStreak(currentStreakCount);
    setMaxStreak(maxStreakCount);
    setStreakAlive(hasActivityToday || hasActivityYesterday);

    // Calculate next milestone
    const milestones = [7, 14, 30, 50, 100, 200, 365];
    const currentValue = viewMode === 'current' ? currentStreakCount : maxStreakCount;
    const next = milestones.find((m) => m > currentValue);
    if (next) {
      setNextMilestone(next);
      setDaysUntilMilestone(next - currentValue);
    } else {
      setDaysUntilMilestone(null);
    }
  }, [enhancedStats, viewMode]);

  const displayStreak = viewMode === 'current' ? currentStreak : maxStreak;
  const fireEmojis = Math.min(Math.floor(displayStreak / 7) + 1, 10); // Max 10 fire emojis

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-br from-orange-950/50 via-red-950/50 to-amber-950/50 border-2 border-orange-900/30 rounded-xl p-6 shadow-lg hover:border-orange-800/50 transition-all relative overflow-hidden"
    >
      {/* Animated fire background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {streakAlive && [...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            🔥
          </motion.div>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4 relative z-10">
        <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('current')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              viewMode === 'current'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setViewMode('max')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              viewMode === 'max'
                ? 'bg-orange-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Max
          </button>
        </div>
      </div>

      {/* Main Streak Display */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={streakAlive && viewMode === 'current' ? { rotate: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.5, repeat: streakAlive && viewMode === 'current' ? Infinity : 0, repeatDelay: 2 }}
            >
              <Flame className="w-6 h-6 text-orange-500" />
            </motion.div>
            <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              {viewMode === 'current' ? 'Current Streak' : 'Max Streak'}
            </span>
          </div>
          {viewMode === 'current' && (
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
              streakAlive 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {streakAlive ? '🔥 ALIVE' : '❄️ FROZEN'}
            </div>
          )}
        </div>

        {/* Streak Number with Fire Emojis */}
        <div className="mb-6">
          <div className="flex items-end gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayStreak}
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                className="text-6xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent"
              >
                {displayStreak}
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-1 mb-2">
              {[...Array(fireEmojis)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                  className="text-2xl"
                >
                  🔥
                </motion.span>
              ))}
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-2">
            {viewMode === 'current' 
              ? streakAlive 
                ? 'Keep the fire burning! 💪' 
                : 'Get back on track!'
              : 'Your best streak ever! 🏆'
            }
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-400">Current</span>
            </div>
            <div className="text-xl font-bold text-white">{currentStreak}</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-zinc-400">Best</span>
            </div>
            <div className="text-xl font-bold text-white">{maxStreak}</div>
          </div>
        </div>

        {/* Milestone Progress */}
        {daysUntilMilestone !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-medium text-zinc-400">Next Milestone</span>
              </div>
              <span className="text-sm font-bold text-orange-400">{nextMilestone} days</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(displayStreak / nextMilestone) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {daysUntilMilestone} more day{daysUntilMilestone !== 1 ? 's' : ''} to reach {nextMilestone} days!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

