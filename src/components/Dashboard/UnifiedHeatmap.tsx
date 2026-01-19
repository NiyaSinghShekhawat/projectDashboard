'use client';

import { ActivityCalendar, Activity } from 'react-activity-calendar';
import { UserStats } from '@/lib/types';
import { subMonths, format, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { enhanceStatsWithAutoActivity } from '@/lib/heatmapSync';

interface HeatmapProps {
  stats: UserStats[];
}

interface DayActivity {
  date: string;
  count: number;
  platforms: string[];
  difficultyWeight: number; // Weighted score based on difficulty
}

export const UnifiedHeatmap = ({ stats }: HeatmapProps) => {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<Activity[]>([]);
  const [totalActiveDays, setTotalActiveDays] = useState(0);
  const [totalSubmissionsYear, setTotalSubmissionsYear] = useState(0);

  // Auto-enhance stats with detected activity changes (runs only when stats change)
  const enhancedStats = useMemo(() => {
    if (stats.length === 0) return stats;
    return enhanceStatsWithAutoActivity(stats);
  }, [stats]);

  useEffect(() => {
    setMounted(true);

    // Enhanced activity map with platform tracking and difficulty weighting
    const activityMap = new Map<string, DayActivity>();

    // Aggregate stats from ALL platforms with unified tracking
    // Use enhancedStats which includes auto-detected activity for today
    enhancedStats.forEach((stat) => {
      if (stat.history) {
        stat.history.forEach((day) => {
          const date = day.date;
          const existing = activityMap.get(date) || {
            date,
            count: 0,
            platforms: [],
            difficultyWeight: 0
          };

          existing.count += day.count;
          if (!existing.platforms.includes(stat.platform)) {
            existing.platforms.push(stat.platform);
          }
          
          // Difficulty weighting: Easy=1, Medium=2, Hard=3 (approximate based on platform stats)
          // For platforms without difficulty breakdown, use count as base weight
          const difficultyMultiplier = stat.medium > 0 || stat.hard > 0 
            ? (stat.hard * 3 + stat.medium * 2 + stat.easy * 1) / stat.totalSolved || 1
            : 1;
          existing.difficultyWeight += day.count * difficultyMultiplier;

          activityMap.set(date, existing);
        });
      }
    });

    // Use last 12 months for heatmap display
    const end = new Date();
    const start = subMonths(end, 12);
    const allDays = eachDayOfInterval({ start, end });
    
    const dateRange: Activity[] = [];
    let activeDaysCount = 0;
    let submissionsCount = 0;

    // Build complete date range for last 12 months
    allDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const activity = activityMap.get(dateStr);
      const count = activity?.count || 0;
      
      // Calculate weighted intensity: combine count and difficulty
      // Normalize to 0-4 scale for heatmap levels
      const weightedScore = activity?.difficultyWeight || 0;
      const baseCount = count;
      
      // Level calculation with weighted difficulty
      let level = 0;
      if (baseCount > 0) {
        // Combine base count and weighted score for better intensity
        const intensity = Math.min(baseCount * 0.7 + weightedScore * 0.3, 15);
        if (intensity >= 10) level = 4;
        else if (intensity >= 5) level = 3;
        else if (intensity >= 2) level = 2;
        else level = 1;
      }

      dateRange.push({
        date: dateStr,
        count,
        level
      });

      if (count > 0) {
        activeDaysCount++;
        submissionsCount += count;
      }
    });

    setData(dateRange);
    setTotalActiveDays(activeDaysCount);
    setTotalSubmissionsYear(submissionsCount);

  }, [enhancedStats]);

  if (!mounted) {
    return (
        <div className="h-40 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600">
            Loading Activity...
        </div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 shadow-sm" // LeetCode dark bg
    >
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
             <span className="text-xl font-medium text-zinc-100">{totalSubmissionsYear}</span>
             <span className="text-sm text-zinc-400">submissions in the past one year</span>
             <Info className="w-4 h-4 text-zinc-600 cursor-pointer hover:text-zinc-400" />
          </div>

          <div className="flex items-center gap-6 text-sm">
             <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                 <span className="text-zinc-500">Total active days:</span>
                 <span className="text-zinc-100 font-medium">{totalActiveDays}</span>
             </div>
          </div>
      </div>

      {/* Heatmap Grid - Fixed rendering */}
      <div className="w-full overflow-x-auto pb-2" style={{ minHeight: '150px' }}>
         <div style={{ minWidth: '800px', padding: '10px 0' }}>
            <ActivityCalendar
              data={data}
              blockRadius={2}
              blockSize={11}
              blockMargin={3}
              fontSize={12}
              maxLevel={4}
              theme={{
                dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'], // GitHub/LeetCode style colors
                light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
              }}
              colorScheme="dark"
              labels={{
                 months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                 weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                 legend: {
                    less: 'Less',
                    more: 'More',
                 },
                 totalCount: '{{count}} submissions in {{year}}',
              }}
              tooltips={{
                activity: {
                  text: (activity: Activity) => {
                    if (activity.count === 0) {
                      return `No submissions on ${format(new Date(activity.date), 'MMM d, yyyy')}`;
                    }
                    return `${activity.count} submission${activity.count !== 1 ? 's' : ''} on ${format(new Date(activity.date), 'MMM d, yyyy')}`;
                  },
                },
              }}
            />
        </div>
      </div>
    </motion.div>
  );
};
