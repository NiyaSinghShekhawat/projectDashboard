export type PlatformName = 'LeetCode' | 'CodeChef' | 'HackerRank' | 'MentorPick';

export interface Contest {
  title: string;
  url: string;
  startTime: string; // ISO string
  duration: string; // e.g., "1h 30m"
  platform: PlatformName;
}

export interface UserStats {
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  ranking?: number;
  username: string;
  platform: PlatformName;
  history?: { date: string; count: number }[]; // For activity graph
}

export interface SyncResponse {
  stats: UserStats[];
  contests: Contest[];
  lastUpdated: string;
}
