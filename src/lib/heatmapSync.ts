/**
 * Utility for automatically syncing heatmap data when question counts increase
 * This detects when totalSolved increases on any platform and adds the difference
 * to today's date in the heatmap, ensuring progress is reflected immediately.
 */

import { UserStats } from './types';
import { format } from 'date-fns';

export interface PlatformSnapshot {
  platform: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  timestamp: string;
}

export interface StoredState {
  platforms: Record<string, PlatformSnapshot>;
  lastSyncDate: string;
}

const STORAGE_KEY = 'codingDashboard_previousState';

/**
 * Get stored previous state from localStorage
 */
function getStoredState(): StoredState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    // Validate stored data is not too old (older than 7 days, reset it)
    const lastSync = new Date(parsed.lastSyncDate);
    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSync > 7) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading stored state:', error);
    return null;
  }
}

/**
 * Store current state to localStorage
 */
function storeState(stats: UserStats[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const platforms: Record<string, PlatformSnapshot> = {};
    
    stats.forEach((stat) => {
      platforms[stat.platform] = {
        platform: stat.platform,
        totalSolved: stat.totalSolved,
        easy: stat.easy,
        medium: stat.medium,
        hard: stat.hard,
        timestamp: new Date().toISOString(),
      };
    });
    
    const state: StoredState = {
      platforms,
      lastSyncDate: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error storing state:', error);
  }
}

/**
 * Calculate the difference in solved problems between current and previous state
 * Returns an array of activities to add to today's date
 */
export function calculateNewActivity(
  currentStats: UserStats[],
  previousState: StoredState | null
): Array<{ platform: string; count: number; difficultyBreakdown: { easy: number; medium: number; hard: number } }> {
  const newActivity: Array<{ platform: string; count: number; difficultyBreakdown: { easy: number; medium: number; hard: number } }> = [];
  
  if (!previousState) {
    // First time sync, store current state but don't add activity
    storeState(currentStats);
    return [];
  }
  
  // Check if last sync was today - if not, we might want to be more conservative
  const lastSyncDate = new Date(previousState.lastSyncDate);
  const today = new Date();
  const isSameDay = lastSyncDate.toDateString() === today.toDateString();
  
  currentStats.forEach((currentStat) => {
    const previous = previousState.platforms[currentStat.platform];
    
    if (!previous) {
      // New platform detected - only count if we're syncing on the same day
      // Otherwise it might be a first-time setup and we shouldn't add historical activity
      if (isSameDay && currentStat.totalSolved > 0) {
        // Count all as new activity for today if it's the same day
        newActivity.push({
          platform: currentStat.platform,
          count: currentStat.totalSolved,
          difficultyBreakdown: {
            easy: currentStat.easy,
            medium: currentStat.medium,
            hard: currentStat.hard,
          },
        });
      }
      return;
    }
    
    // Calculate difference
    const diff = currentStat.totalSolved - previous.totalSolved;
    
    // Only add activity if:
    // 1. There's a positive difference
    // 2. The difference is reasonable (not a data error - e.g., more than 100 in one sync)
    // 3. Or if it's the same day as last sync (normal case)
    if (diff > 0 && (diff <= 100 || isSameDay)) {
      // Calculate how many of each difficulty were added
      const easyDiff = currentStat.easy - previous.easy;
      const mediumDiff = currentStat.medium - previous.medium;
      const hardDiff = currentStat.hard - previous.hard;
      
      // Use the actual differences, ensuring non-negative
      let easyAdded = Math.max(0, easyDiff);
      let mediumAdded = Math.max(0, mediumDiff);
      let hardAdded = Math.max(0, hardDiff);
      
      // If the sum doesn't match diff (due to rounding or missing data), distribute proportionally
      const totalDiff = easyAdded + mediumAdded + hardAdded;
      if (totalDiff !== diff && currentStat.totalSolved > 0) {
        // Distribute remaining/overflow based on current ratios
        const remaining = diff - totalDiff;
        if (Math.abs(remaining) > 0) {
          const easyRatio = currentStat.easy / currentStat.totalSolved;
          const mediumRatio = currentStat.medium / currentStat.totalSolved;
          const hardRatio = currentStat.hard / currentStat.totalSolved;
          
          // Adjust proportionally
          if (remaining > 0) {
            easyAdded += Math.round(remaining * easyRatio);
            mediumAdded += Math.round(remaining * mediumRatio);
            hardAdded += remaining - Math.round(remaining * easyRatio) - Math.round(remaining * mediumRatio);
          } else {
            // If totalDiff > diff, reduce proportionally
            const totalOverflow = totalDiff;
            easyAdded = Math.max(0, Math.round(diff * easyRatio));
            mediumAdded = Math.max(0, Math.round(diff * mediumRatio));
            hardAdded = diff - easyAdded - mediumAdded;
          }
        }
      }
      
      newActivity.push({
        platform: currentStat.platform,
        count: diff,
        difficultyBreakdown: {
          easy: Math.max(0, easyAdded),
          medium: Math.max(0, mediumAdded),
          hard: Math.max(0, hardAdded),
        },
      });
    }
  });
  
  // Store updated state for next comparison
  storeState(currentStats);
  
  return newActivity;
}

/**
 * Enhance stats with auto-detected activity for today
 * This adds activity entries to today's date based on increases in totalSolved
 */
export function enhanceStatsWithAutoActivity(stats: UserStats[]): UserStats[] {
  const previousState = getStoredState();
  const newActivity = calculateNewActivity(stats, previousState);
  
  if (newActivity.length === 0) {
    return stats;
  }
  
  // Add new activity to today's date for platforms that had increases
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  return stats.map((stat) => {
    const activity = newActivity.find((a) => a.platform === stat.platform);
    
    if (!activity) {
      return stat;
    }
    
    // Check if history exists and has today's date
    const history = stat.history || [];
    const todayIndex = history.findIndex((day) => day.date === todayStr);
    
    if (todayIndex >= 0) {
      // Update existing entry for today
      const updatedHistory = [...history];
      updatedHistory[todayIndex] = {
        date: todayStr,
        count: updatedHistory[todayIndex].count + activity.count,
      };
      return { ...stat, history: updatedHistory };
    } else {
      // Add new entry for today
      return {
        ...stat,
        history: [...history, { date: todayStr, count: activity.count }],
      };
    }
  });
}

/**
 * Reset stored state (useful for testing or manual reset)
 */
export function resetStoredState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

