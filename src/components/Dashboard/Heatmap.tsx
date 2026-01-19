'use client';

import { ActivityCalendar, Activity } from 'react-activity-calendar';
import { UserStats } from '@/lib/types';
import { subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeatmapProps {
  stats: UserStats[];
}

export const Heatmap = ({ stats }: HeatmapProps) => {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<Activity[]>([]);

  useEffect(() => {
    setMounted(true);

    // 1. Process Data on Client (forces consistent hydration)
    const activityMap = new Map<string, number>();
    
    stats.forEach(stat => {
      stat.history?.forEach(day => {
        const current = activityMap.get(day.date) || 0;
        activityMap.set(day.date, current + day.count);
      });
    });

    // 2. Build continuous date range (Last 6 months)
    const end = new Date();
    const start = subMonths(end, 6);
    const dateRange: Activity[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const count = activityMap.get(dateStr) || 0;
        
        // Calculate level manually
        let level = 0;
        if (count > 0) level = 1;
        if (count > 2) level = 2;
        if (count > 5) level = 3;
        if (count > 9) level = 4;

        dateRange.push({
            date: dateStr,
            count,
            level, 
        });
    }

    setData(dateRange);
  }, [stats]);

  if (!mounted) return <div className="p-10 text-zinc-500">Loading Heatmap...</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg h-full overflow-hidden">
      <h3 className="text-zinc-100 font-semibold text-lg mb-6">Activity Heatmap</h3>
      
      <div className="flex justify-center w-full">
        <ActivityCalendar
          data={data}
          blockRadius={3}
          blockSize={12}
          blockMargin={4}
          theme={{
            // Level 0: zinc-800 (#27272a) - visible on zinc-900
            dark: ['#27272a', '#0e4429', '#006d32', '#26a641', '#39d353'],
            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
          }}
          colorScheme="dark"
          labels={{
            legend: {
              less: 'Less',
              more: 'More',
            },
          }}
          renderBlock={(block, activity) => (
             <div title={`${activity.count} activities on ${activity.date}`}>
                {block}
             </div>
          )}
        />
      </div>
    </div>
  );
};
