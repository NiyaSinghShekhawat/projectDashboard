import { getLeetCodeStats, getLeetCodeContests } from './leetcode';
import { getCodeChefStats, getCodeChefContests } from './codechef';
import { getMentorPickContests, getMentorPickStats } from './mentorpick';
import { UserStats, Contest } from '../types';

export const getAllStats = async (usernames: { leetcode?: string; codechef?: string; hackerrank?: string; mentorpick?: string }) => {
  const promises: Promise<UserStats | null>[] = [];

  if (usernames.leetcode) {
    promises.push(getLeetCodeStats(usernames.leetcode));
  }
  if (usernames.codechef) {
    promises.push(getCodeChefStats(usernames.codechef));
  }
  if (usernames.mentorpick) {
    promises.push(getMentorPickStats(usernames.mentorpick));
  }

  const results = await Promise.allSettled(promises);
  
  const stats: UserStats[] = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      stats.push(result.value);
    }
  });

  return stats;
};

export const getAllContests = async () => {
  const promises = [
    getLeetCodeContests(),
    getCodeChefContests(),
    getMentorPickContests(),
  ];

  const results = await Promise.allSettled(promises);
  
  let contests: Contest[] = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      contests = [...contests, ...result.value];
    }
  });

  // Sort by start time
  contests.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  return contests;
};
