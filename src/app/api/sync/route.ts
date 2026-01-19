import { NextResponse } from 'next/server';
import { getAllStats, getAllContests } from '@/lib/scrapers';
import { USERNAMES } from '@/lib/config';

export async function GET() {
  try {
    const stats = await getAllStats(USERNAMES);
    const contests = await getAllContests();

    return NextResponse.json({
      stats,
      contests,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}
