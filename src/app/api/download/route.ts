// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { Collection } from 'mongodb';

const EXTERNAL_API_URL = 'https://saio-api.vercel.app/service';
const SUBMITTED_URLS_COLLECTION = 'submitted_urls';

// User agent standar (sama seperti yang digunakan untuk download video)
const COMMON_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

async function updateDbStatus(
  collection: Collection | null,
  tiktokUrl: string | null,
  status: string,
  errorMsg?: string,
  details?: object
) {
  if (!collection || !tiktokUrl) return; // Jangan lakukan apa-apa jika DB atau URL tidak valid
  try {
    await collection.updateOne(
      { url: tiktokUrl, status: { $nin: ['success', 'failed_final'] } },
      {
        $set: {
          status: status,
          lastUpdatedAt: new Date(),
          ...(errorMsg && { error: errorMsg }),
          ...(details && { details: details }),
        },
      },
      { upsert: false }
    );
  } catch (dbUpdateError) {
    console.error(
      `[DB] Failed to update status to '${status}' for ${tiktokUrl}:`,
      dbUpdateError
    );
  }
}

export async function POST(request: NextRequest) {
  let dbCollection: Collection | null = null;
  let tiktokUrl: string | null = null;

  try {
    const body = await request.json();
    tiktokUrl = body.url;

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

    // Koneksi dan Insert DB (Logika tidak berubah)
    try {
      const { db } = await connectToDatabase();
      dbCollection = db.collection(SUBMITTED_URLS_COLLECTION);
      const docToInsert = {
        url: tiktokUrl,
        submittedAt: new Date(),
        status: 'pending',
        lastUpdatedAt: new Date(),
        error: null,
        details: null,
      };
      dbCollection
        .insertOne(docToInsert)
        .then((result) =>
          console.log(
            `[DB] URL inserted: ${tiktokUrl}, ID: ${result.insertedId}`
          )
        )
        .catch((dbError) =>
          console.error(`[DB] Failed to insert URL ${tiktokUrl}:`, dbError)
        );
    } catch (dbConnectError) {
      console.error(
        '[DB] Failed to connect or insert initial record:',
        dbConnectError
      );
      dbCollection = null;
    }

    console.log(
      `[Route Handler] Memanggil API eksternal: ${EXTERNAL_API_URL} untuk URL: ${tiktokUrl}`
    );

    // --- MODIFIKASI PANGGILAN API EKSTERNAL ---
    const apiResponse = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // --- TAMBAHKAN USER AGENT ---
        'User-Agent': COMMON_USER_AGENT,
      },
      body: JSON.stringify({ url: tiktokUrl }),
    });
    // --- AKHIR MODIFIKASI ---

    if (!apiResponse.ok) {
      const errorText = await apiResponse
        .text()
        .catch(() => 'Tidak bisa membaca detail error API eksternal');
      console.error(
        `[Route Handler] Gagal memanggil API eksternal: Status ${apiResponse.status}, Body: ${errorText}`
      );
      await updateDbStatus(
        dbCollection,
        tiktokUrl,
        'failed_api',
        `API Error: ${apiResponse.status} - ${errorText.substring(0, 200)}`
      ); // Log sebagian error text
      throw new Error(
        `Gagal mendapatkan data dari layanan eksternal: Status ${apiResponse.status}`
      );
    }
    const apiData = await apiResponse.json();

    // Ekstrak data (Logika tidak berubah)
    const cookie = apiData?.data?.cookie;
    const directVideoUrl = apiData?.data?.content?.video?.playAddr;
    const uniqueId = apiData?.data?.content?.author?.uniqueId;
    const videoId = apiData?.data?.content?.id;
    const videoDesc = apiData?.data?.content?.desc;

    if (!directVideoUrl) {
      console.error(
        "[Route Handler] Respons API eksternal tidak berisi 'data.content.video.playAddr'."
      );
      await updateDbStatus(
        dbCollection,
        tiktokUrl,
        'failed_no_url',
        'No video URL in API response',
        apiData
      );
      throw new Error(
        'Tidak dapat menemukan URL video dalam respons layanan eksternal.'
      );
    }

    await updateDbStatus(dbCollection, tiktokUrl, 'processing', undefined, {
      videoId,
      uniqueId,
      videoDesc,
    });

    // Fetch video (Logika tidak berubah, pastikan User-Agent sama jika diperlukan)
    console.log(
      `[Route Handler] URL Video dari API Eksternal: ${directVideoUrl}`
    );
    const videoResponse = await fetch(directVideoUrl, {
      method: 'GET',
      headers: {
        Referer: 'https://www.tiktok.com/',
        'User-Agent': COMMON_USER_AGENT, // Gunakan User-Agent yang sama
        ...(cookie && { cookie: cookie }),
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    // ... (Sisa logika penanganan respons video, update DB success/failed, dan streaming tidak berubah) ...
    if (!videoResponse.ok) {
      const errorText = await videoResponse
        .text()
        .catch(() => 'Tidak bisa membaca detail error download');
      console.error(
        `[Route Handler] Gagal fetch video: Status ${videoResponse.status}, Body: ${errorText}`
      );
      await updateDbStatus(
        dbCollection,
        tiktokUrl,
        'failed_download',
        `Download Error: ${videoResponse.status}`
      );
      throw new Error(
        `Gagal mengambil video dari URL langsung: Status ${videoResponse.status}`
      );
    }
    if (!videoResponse.body) {
      await updateDbStatus(
        dbCollection,
        tiktokUrl,
        'failed_no_body',
        'Video response had no body'
      );
      throw new Error('Respons video tidak memiliki body untuk di-stream.');
    }

    await updateDbStatus(dbCollection, tiktokUrl, 'success');

    // Streaming response (Logika tidak berubah)
    const headers = new Headers();
    let filename = 'tiktok_video.mp4';
    if (uniqueId && videoId) filename = `tiktok_${uniqueId}_${videoId}.mp4`;
    else if (videoId) filename = `tiktok_${videoId}.mp4`;
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    const contentType =
      videoResponse.headers.get('content-type') || 'video/mp4';
    headers.set('Content-Type', contentType);
    const contentLength = videoResponse.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    return new NextResponse(videoResponse.body, {
      status: 200,
      statusText: 'OK',
      headers,
    });
  } catch (error) {
    console.error('[Route Handler] Error:', error);
    // Update status DB di blok catch utama
    await updateDbStatus(
      dbCollection,
      tiktokUrl,
      'failed_final',
      'Unknown error in final catch'
    );

    return NextResponse.json(
      { error: 'Gagal memproses permintaan download.' },
      { status: 500 }
    );
  }
}
