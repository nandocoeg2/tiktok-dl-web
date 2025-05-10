// app/api/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { Collection } from 'mongodb';

const EXTERNAL_API_URL = 'https://saio-api.vercel.app/service';
const VIDEOS_COLLECTION = 'tiktok_videos';

// User agent standar
const COMMON_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

export async function POST(request: NextRequest) {
  let dbCollection: Collection | null = null;

  try {
    const body = await request.json();
    const tiktokUrl = body.url;

    if (
      !tiktokUrl ||
      typeof tiktokUrl !== 'string' ||
      !(
        tiktokUrl.includes('tiktok.com/t/') ||
        tiktokUrl.includes('tiktok.com/@')
      )
    ) {
      return NextResponse.json(
        { error: 'URL TikTok tidak valid.' },
        { status: 400 }
      );
    }

    console.log(
      `[Fetch Route Handler] Memanggil API eksternal: ${EXTERNAL_API_URL} untuk URL: ${tiktokUrl}`
    );

    const apiResponse = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': COMMON_USER_AGENT,
      },
      body: JSON.stringify({ url: tiktokUrl }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse
        .text()
        .catch(() => 'Tidak bisa membaca detail error API eksternal');
      console.error(
        `[Fetch Route Handler] Gagal memanggil API eksternal: Status ${apiResponse.status}, Body: ${errorText}`
      );
      throw new Error(
        `Gagal mendapatkan data dari layanan eksternal: Status ${apiResponse.status}`
      );
    }

    const apiData = await apiResponse.json();

    // Get creation time from API or use current time
    const createTime =
      apiData?.data?.content?.createTime ||
      Math.floor(Date.now() / 1000).toString();

    // Extract collectCount if available
    const collectCount = apiData?.data?.content?.stats?.collectCount || '0';

    // Ekstrak data yang diperlukan dengan format yang diminta
    const videoInfo = {
      directVideoUrl: apiData?.data?.content?.video?.playAddr,
      author: apiData?.data?.content?.author?.uniqueId,
      nickname: apiData?.data?.content?.author?.nickname,
      video: {
        id: apiData?.data?.content?.id,
        createTime: createTime,
      },
      description: apiData?.data?.content?.desc,
      stats: {
        diggCount: apiData?.data?.content?.stats?.diggCount || 0,
        shareCount: apiData?.data?.content?.stats?.shareCount || 0,
        commentCount: apiData?.data?.content?.stats?.commentCount || 0,
        playCount: apiData?.data?.content?.stats?.playCount || 0,
        collectCount: collectCount,
      },
      coverUrl: apiData?.data?.content?.video?.cover,
      dynamicCover: apiData?.data?.content?.video?.dynamicCover,
      duration: apiData?.data?.content?.video?.duration,
    };

    if (!videoInfo.directVideoUrl) {
      console.error(
        "[Fetch Route Handler] Respons API eksternal tidak berisi 'data.content.video.playAddr'."
      );
      throw new Error(
        'Tidak dapat menemukan URL video dalam respons layanan eksternal.'
      );
    }

    // Connect to database and store video information
    try {
      const { db } = await connectToDatabase();
      dbCollection = db.collection(VIDEOS_COLLECTION);

      // Check if video already exists in database
      const existingVideo = await dbCollection.findOne({
        'video.id': videoInfo.video.id,
      });

      if (existingVideo) {
        // Update existing record
        await dbCollection.updateOne(
          { 'video.id': videoInfo.video.id },
          {
            $set: {
              ...videoInfo,
              originalUrl: tiktokUrl,
              lastUpdatedAt: new Date(),
            },
          }
        );
        console.log(
          `[DB] Video information updated for ID: ${videoInfo.video.id}`
        );
      } else {
        // Insert new record
        const result = await dbCollection.insertOne({
          ...videoInfo,
          originalUrl: tiktokUrl,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
        });
        console.log(
          `[DB] Video information inserted with ID: ${result.insertedId}`
        );
      }
    } catch (dbError) {
      console.error('[DB] Failed to store video information:', dbError);
      // Continue even if DB operation fails
    }

    return NextResponse.json(
      {
        success: true,
        videoInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Fetch Route Handler] Error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses permintaan fetch.' },
      { status: 500 }
    );
  }
}
