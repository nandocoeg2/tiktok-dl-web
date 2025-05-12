// app/api/bulk-download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { Collection } from 'mongodb';
import { resolveTikTokUrl, isValidTikTokUrl } from '@/app/utils/url-resolver';

const EXTERNAL_API_URL = 'https://saio-api.vercel.app/service';
const BULK_DOWNLOADS_COLLECTION = 'bulk_downloads';

// User agent standar
const COMMON_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

interface BulkDownloadItem {
  url: string;
  resolvedUrl?: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  error?: string;
  videoInfo?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface BulkDownloadRequest {
  id: string;
  urls: string[];
  status: 'pending' | 'processing' | 'completed';
  items: BulkDownloadItem[];
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs provided or invalid format' },
        { status: 400 }
      );
    }

    // Validate URLs
    const validUrls = urls.filter((url) => isValidTikTokUrl(url));

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid TikTok URLs found' },
        { status: 400 }
      );
    }

    // Create bulk download request
    const bulkDownloadId = `bulk-${Date.now()}`;
    const bulkDownloadItems: BulkDownloadItem[] = validUrls.map((url) => ({
      url,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const bulkDownloadRequest: BulkDownloadRequest = {
      id: bulkDownloadId,
      urls: validUrls,
      status: 'pending',
      items: bulkDownloadItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    try {
      const { db } = await connectToDatabase();
      const bulkCollection = db.collection(BULK_DOWNLOADS_COLLECTION);

      await bulkCollection.insertOne(bulkDownloadRequest);
      console.log(
        `[DB] Bulk download request created with ID: ${bulkDownloadId}`
      );
    } catch (dbError) {
      console.error('[DB] Failed to store bulk download request:', dbError);
      // Continue even if DB operation fails
    }

    return NextResponse.json(
      {
        success: true,
        bulkDownloadId,
        totalUrls: validUrls.length,
        invalidUrls: urls.length - validUrls.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Bulk Download Route Handler] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk download request' },
      { status: 500 }
    );
  }
}

// Get status of a bulk download request
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bulkDownloadId = searchParams.get('id');

    if (!bulkDownloadId) {
      return NextResponse.json(
        { error: 'No bulk download ID provided' },
        { status: 400 }
      );
    }

    // Get from database
    try {
      const { db } = await connectToDatabase();
      const bulkCollection = db.collection(BULK_DOWNLOADS_COLLECTION);

      const bulkDownloadRequest = await bulkCollection.findOne({
        id: bulkDownloadId,
      });

      if (!bulkDownloadRequest) {
        return NextResponse.json(
          { error: 'Bulk download request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          bulkDownloadRequest,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('[DB] Failed to retrieve bulk download request:', dbError);
      return NextResponse.json(
        { error: 'Failed to retrieve bulk download request from database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Bulk Download Route Handler] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get bulk download status' },
      { status: 500 }
    );
  }
}
