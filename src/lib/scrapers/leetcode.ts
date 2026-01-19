import axios from 'axios';
import * as cheerio from 'cheerio';
import { UserStats, Contest } from '../types';

const LEETCODE_API = 'https://leetcode.com/graphql';

export const getLeetCodeStats = async (username: string): Promise<UserStats | null> => {
  try {
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          submissionCalendar
          profile {
            ranking
          }
        }
      }
    `;

    const response = await axios.post(
      LEETCODE_API,
      {
        query,
        variables: { username },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; CodingDashboard/1.0)',
        },
      }
    );

    const data = response.data.data.matchedUser;
    if (!data) return null;

    const stats = data.submitStats.acSubmissionNum;
    const easy = stats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = stats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find((s: any) => s.difficulty === 'Hard')?.count || 0;
    const total = stats.find((s: any) => s.difficulty === 'All')?.count || 0;

    // Parse Submission Calendar (Format: "{\"1726099200\": 1, ...}")
    const calendar: Record<string, number> = JSON.parse(data.submissionCalendar || '{}');
    const history = Object.entries(calendar).map(([timestamp, count]) => {
      // Timestamp is in seconds
      const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
      return { date, count };
    });

    return {
      platform: 'LeetCode',
      username: data.username,
      totalSolved: total,
      easy,
      medium,
      hard,
      ranking: data.profile?.ranking || 0,
      history,
    };
  } catch (error) {
    console.error('LeetCode scraping error:', error);
    return null;
  }
};

export const getLeetCodeContests = async (): Promise<Contest[]> => {
  try {
    const contests: Contest[] = [];

    // Strategy: GraphQL for reliable upcoming contests data
    const query = `
      query upcomingContests {
        topTwoContests {
          title
          titleSlug
          startTime
          duration
        }
      }
    `;
    
    // Using the same axios instance/method as stats
    const gqlRes = await axios.post(
      LEETCODE_API,
      { query },
      {
         headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; CodingDashboard/1.0)',
        },
      }
    );
    
    const upcoming = gqlRes.data.data.topTwoContests;
    if (upcoming) {
      upcoming.forEach((c: any) => {
        contests.push({
          title: c.title,
          url: `https://leetcode.com/contest/${c.titleSlug}`,
          startTime: new Date(c.startTime * 1000).toISOString(),
          duration: `${c.duration / 60 / 60}h`,
          platform: 'LeetCode',
        });
      });
    }

    return contests;
  } catch (error) {
    console.error('LeetCode contest scraping error:', error);
    return [];
  }
};
