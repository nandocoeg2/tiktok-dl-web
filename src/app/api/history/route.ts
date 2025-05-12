// app/api/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';

// Collections to fetch history from
const VIDEOS_COLLECTION = 'tiktok_videos';
const SUBMITTED_URLS_COLLECTION = 'submitted_urls';
const BULK_DOWNLOADS_COLLECTION = 'bulk_downloads';

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    const { db } = await connectToDatabase();

    // Fetch video history
    const videos = await db
      .collection(VIDEOS_COLLECTION)
      .find({})
      .sort({ lastUpdatedAt: -1 })
      .toArray();

    // Fetch single download history - exclude success status
    const singleDownloads = await db
      .collection(SUBMITTED_URLS_COLLECTION)
      .find({ status: { $ne: 'success' } })
      .sort({ lastUpdatedAt: -1 })
      .toArray();

    // Fetch bulk download history
    const bulkDownloads = await db
      .collection(BULK_DOWNLOADS_COLLECTION)
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        videos,
        singleDownloads,
        bulkDownloads,
      },
    });
  } catch (error) {
    console.error('[History API] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download history' },
      { status: 500 }
    );
  }
}
