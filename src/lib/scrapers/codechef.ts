import axios from 'axios';
import * as cheerio from 'cheerio';
import { UserStats, Contest } from '../types';

export const getCodeChefStats = async (username: string): Promise<UserStats | null> => {
  try {
    const url = `https://www.codechef.com/users/${username}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(data);
    
    // Scrape Rating
    const ratingText = $('.rating-number').text();
    const rating = parseInt(ratingText, 10) || 0;

    // Scrape Total Solved
    // Selector: h3 that contains "Total Problems Solved"
    let totalSolved = 0;
    $('h3').each((_, el) => {
      const text = $(el).text();
      if (text.includes('Total Problems Solved')) {
        const match = text.match(/Total Problems Solved:\s*(\d+)/);
        if (match) {
          totalSolved = parseInt(match[1], 10);
        }
      }
    });

    // Scrape Heatmap / History
    // Selector: rect.day inside svg.js-heatmap
    const history: { date: string; count: number }[] = [];
    $('rect.day').each((_, el) => {
      const date = $(el).attr('data-date');
      const count = parseInt($(el).attr('data-count') || '0', 10);
      if (date && count > 0) {
        history.push({ date, count });
      }
    });
    
    return {
      platform: 'CodeChef',
      username,
      totalSolved,
      easy: 0, 
      medium: 0,
      hard: 0,
      ranking: rating,
      history,
    };
  } catch (error) {
    console.error('CodeChef scraping error:', error);
    return null;
  }
};

export const getCodeChefContests = async (): Promise<Contest[]> => {
  try {
    // CodeChef public API endpoint for contests
    const { data } = await axios.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CodingDashboard/1.0)',
      },
    });

    const contests: Contest[] = [];
    
    // Response structure: { present_contests: [], future_contests: [], ... }
    const future = data.future_contests || [];
    const present = data.present_contests || [];
    
    const all = [...present, ...future];

    all.slice(0, 5).forEach((c: any) => {
      contests.push({
        title: c.contest_name,
        url: `https://www.codechef.com/${c.contest_code}`,
        startTime: c.contest_start_date_iso, // Usually present
        duration: `${c.contest_duration}m`,
        platform: 'CodeChef',
      });
    });

    return contests;
  } catch (error) {
    console.error('CodeChef contest scraping error:', error);
    return [];
  }
};
