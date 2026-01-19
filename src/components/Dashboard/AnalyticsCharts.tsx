'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { UserStats } from '@/lib/types';
import { format, subMonths, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { enhanceStatsWithAutoActivity } from '@/lib/heatmapSync';

interface AnalyticsChartsProps {
  stats: UserStats[];
}

type ChartType = 'difficulty' | 'trends' | 'platforms' | 'weekly';

export const AnalyticsCharts = ({ stats }: AnalyticsChartsProps) => {
  const [activeChart, setActiveChart] = useState<ChartType>('difficulty');

  // Auto-enhance stats with detected activity changes (same as heatmap)
  const enhancedStats = useMemo(() => {
    if (stats.length === 0) return stats;
    return enhanceStatsWithAutoActivity(stats);
  }, [stats]);

  // Calculate total difficulty breakdown across all platforms (using enhanced stats)
  const difficultyData = useMemo(() => {
    const totals = enhancedStats.reduce(
      (acc, stat) => ({
        easy: acc.easy + stat.easy,
        medium: acc.medium + stat.medium,
        hard: acc.hard + stat.hard,
        total: acc.total + stat.totalSolved,
      }),
      { easy: 0, medium: 0, hard: 0, total: 0 }
    );

    return [
      { name: 'Easy', value: totals.easy, color: '#10b981', fill: '#10b981' },
      { name: 'Medium', value: totals.medium, color: '#eab308', fill: '#eab308' },
      { name: 'Hard', value: totals.hard, color: '#f43f5e', fill: '#f43f5e' },
    ].filter((item) => item.value > 0);
  }, [enhancedStats]);

  // Calculate submission trends (last 30 days) - using enhanced stats
  const trendsData = useMemo(() => {
    const activityMap = new Map<string, { count: number; easy: number; medium: number; hard: number }>();
    
    enhancedStats.forEach((stat) => {
      if (stat.history) {
        stat.history.forEach((day) => {
          const existing = activityMap.get(day.date) || { count: 0, easy: 0, medium: 0, hard: 0 };
          existing.count += day.count;
          // Approximate difficulty distribution based on platform stats
          const easyRatio = stat.totalSolved > 0 ? stat.easy / stat.totalSolved : 0;
          const mediumRatio = stat.totalSolved > 0 ? stat.medium / stat.totalSolved : 0;
          existing.easy += Math.round(day.count * easyRatio);
          existing.medium += Math.round(day.count * mediumRatio);
          existing.hard += day.count - existing.easy - existing.medium;
          activityMap.set(day.date, existing);
        });
      }
    });

    const end = new Date();
    const start = subMonths(end, 1);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const data = activityMap.get(dateStr) || { count: 0, easy: 0, medium: 0, hard: 0 };
      return {
        date: format(day, 'MMM d'),
        fullDate: dateStr,
        submissions: data.count,
        easy: data.easy,
        medium: data.medium,
        hard: data.hard,
      };
    });
  }, [enhancedStats]);

  // Platform comparison data - using enhanced stats
  const platformData = useMemo(() => {
    return enhancedStats.map((stat) => ({
      platform: stat.platform,
      total: stat.totalSolved,
      easy: stat.easy,
      medium: stat.medium,
      hard: stat.hard,
    }));
  }, [enhancedStats]);

  // Weekly activity summary - using enhanced stats
  const weeklyData = useMemo(() => {
    const activityMap = new Map<string, number>();
    
    enhancedStats.forEach((stat) => {
      if (stat.history) {
        stat.history.forEach((day) => {
          const count = activityMap.get(day.date) || 0;
          activityMap.set(day.date, count + day.count);
        });
      }
    });

    const end = new Date();
    const start = subMonths(end, 3); // Last 3 months
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      let weekSubmissions = 0;
      
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      weekDays.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        weekSubmissions += activityMap.get(dateStr) || 0;
      });

      return {
        week: format(weekStart, 'MMM d'),
        submissions: weekSubmissions,
      };
    });
  }, [enhancedStats]);

  const charts = [
    { id: 'difficulty' as ChartType, label: 'Difficulty Breakdown', icon: PieChartIcon },
    { id: 'trends' as ChartType, label: 'Daily Trends', icon: TrendingUp },
    { id: 'platforms' as ChartType, label: 'Platform Comparison', icon: BarChart3 },
    { id: 'weekly' as ChartType, label: 'Weekly Activity', icon: Calendar },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-zinc-300 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg"
    >
      {/* Chart Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {charts.map((chart) => {
          const Icon = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeChart === chart.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {chart.label}
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="h-[400px]">
        {activeChart === 'difficulty' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                        <p className="text-sm font-medium text-zinc-300 mb-1">
                          {payload[0].name}
                        </p>
                        <p className="text-lg font-bold text-white">
                          {payload[0].value} problems
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'trends' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData}>
              <defs>
                <linearGradient id="colorEasy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Area
                type="monotone"
                dataKey="easy"
                stackId="1"
                stroke="#10b981"
                fill="url(#colorEasy)"
                name="Easy"
              />
              <Area
                type="monotone"
                dataKey="medium"
                stackId="1"
                stroke="#eab308"
                fill="url(#colorMedium)"
                name="Medium"
              />
              <Area
                type="monotone"
                dataKey="hard"
                stackId="1"
                stroke="#f43f5e"
                fill="url(#colorHard)"
                name="Hard"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'platforms' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="platform" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Bar dataKey="easy" stackId="a" fill="#10b981" name="Easy" />
              <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
              <Bar dataKey="hard" stackId="a" fill="#f43f5e" name="Hard" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'weekly' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Submissions"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

