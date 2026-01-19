import axios from 'axios';
import * as cheerio from 'cheerio';
import { UserStats, Contest } from '../types';

export const getMentorPickContests = async (): Promise<Contest[]> => {
  try {
    // Fetch 'scheduled' contests to get upcoming ones directly
    const { data } = await axios.get(
      'https://mentorpick.com/api/contest/public?title=&status=scheduled&limit=20&page=1&type=null',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CodingDashboard/1.0)',
        },
      }
    );

    const contests: Contest[] = [];
    const rawContests = data.data || [];

    rawContests.forEach((c: any) => {
      // Filter for PUBLIC contests as requested
      if (c.type !== 'public') return;

      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      
      // Basic validation
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      const durationMs = end.getTime() - start.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      contests.push({
        title: c.title,
        url: `https://mentorpick.com/contest/${c.slug || c._id}`,
        startTime: c.startTime,
        duration: durationHours >= 1 ? `${durationHours.toFixed(1)}h` : `${(durationHours * 60).toFixed(0)}m`,
        platform: 'MentorPick',
      });
    });

    return contests;
  } catch (error) {
    console.error('MentorPick contest scraping error:', error);
    return [];
  }
};

// Basic UserStats implementation for MentorPick
export const getMentorPickStats = async (userId: string): Promise<UserStats | null> => {
  try {
     // 1. Fetch Overall Summary (Total Solved, etc.)
     // Based on inspection: https://mentorpick.com/api/user/submissions/25251a6749-niya
     const summaryRes = await axios.get(`https://mentorpick.com/api/user/submissions/${userId}`, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://mentorpick.com/',
            'Accept': 'application/json'
        },
        timeout: 8000 // 8 seconds timeout
     });
     
     const summaryData = summaryRes.data;
     
     // Structure: { status: "success", data: { overAllSummary: { problemSolved: 4, ... } } }
     const totalSolved = summaryData.data?.overAllSummary?.problemSolved || 0;
     
     // MentorPick doesn't expose strict Easy/Medium/Hard in the API easily.
     // We will put totalSolved into 'easy' as a safe default or distribute?
     // Let's just use totalSolved.
     
     // 2. Fetch Heatmap History (Current Year + Previous Year)
     const currentYear = new Date().getFullYear();
     const heatmapRes = await axios.get(`https://mentorpick.com/api/user/submissions/year/${userId}/${currentYear}`, {
         headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CodingDashboard/1.0)' }
     });

     let rawHistory = heatmapRes.data.data || [];
     
     // Try previous year if needed (optional)
     // const heatmapResPrev = await axios.get(`https://mentorpick.com/api/user/submissions/year/${userId}/${currentYear - 1}`, ...);
     // rawHistory = [...(heatmapResPrev.data.data || []), ...rawHistory];
     
     const history = rawHistory.map((item: any) => {
        // Data format: { "_id": "16-01-2026", "count": 4, "acceptedCount": 1, ... }
        // The API actually returns "_id" as the date string "DD-MM-YYYY" based on typical pattern, 
        // OR it might have a "date" field. 
        // Inspection said "date", "count", "acceptedCount". Use those.
        
        let date = item.date || item._id; // Fallback
        
        // Parse "16-01-2026" to "2026-01-16"
        if (date && date.includes('-')) {
           const parts = date.split('-');
           if (parts.length === 3 && parts[2].length === 4) {
              date = `${parts[2]}-${parts[1]}-${parts[0]}`;
           }
        }
        
        // Use 'count' for activity (attempts) or 'acceptedCount' for solved.
        // Heatmaps usually track activity (submissions).
        return {
           date: date,
           count: item.count || 0
        };
     });

     return {
        platform: 'MentorPick',
        username: userId,
        totalSolved,
        easy: totalSolved, // Placeholder
        medium: 0,
        hard: 0,
        ranking: 0,
        history
     };

  } catch (error) {
    console.error('MentorPick API stats failed, trying HTML fallback:', error);
    
    try {
        // Fallback: Scrape Profile Page HTML
        // Profile URL: https://mentorpick.com/profile/25251a6749-niya
        // Extract userId part if full URL wasn't provided (username is likely "25251a6749-niya")
        const profileUrl = `https://mentorpick.com/profile/${userId}`;
        const { data: html } = await axios.get(profileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });

        const $ = cheerio.load(html);
        
        // Selector logic based on typical Mantine/React structures or text search
        // User's inspection said: "button.mantine-agceib + div" or text "Problems Solved"
        // Let's try to find text "Problems Solved" and look for the number nearby.
        
        // Method 1: Search all text nodes
        let totalSolved = 0;
        
        /* 
           Assume structure might be:
           <div>Problems Solved</div>
           <div>4</div>
        */
        const solvedLabel = $("div:contains('Problems Solved')").last();
        if (solvedLabel.length > 0) {
            // Try next sibling or parent's other child
            const nextDiv = solvedLabel.next('div'); 
            if (nextDiv.length > 0) {
                const num = parseInt(nextDiv.text(), 10);
                if (!isNaN(num)) totalSolved = num;
            } else {
                 // Maybe it's in a parent container?
                 // Checking parent text?
                 const parentText = solvedLabel.parent().text();
                 // "Problems Solved4" -> regex
                 const match = parentText.match(/Problems Solved\s*(\d+)/);
                 if (match) totalSolved = parseInt(match[1], 10);
            }
        }
        
        // If 0, assume fallback failed or user really has 0.
        
        return {
            platform: 'MentorPick',
            username: userId,
            totalSolved: totalSolved,
            easy: totalSolved, // Placeholder
            medium: 0,
            hard: 0,
            ranking: 0,
            history: [] // Heatmap history is too hard to scrape from HTML cleanly without API
        };

    } catch (fallbackError) {
         console.error('MentorPick fallback scraping error:', fallbackError);
         return {
            platform: 'MentorPick',
            username: userId,
            totalSolved: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            ranking: 0,
            history: []
         };
    }
  }
};
