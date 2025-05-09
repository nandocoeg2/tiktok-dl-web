// app/api/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://saio-api.vercel.app/service';

// User agent standar
const COMMON_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

export async function POST(request: NextRequest) {
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

    // Ekstrak data yang diperlukan
    const videoInfo = {
      directVideoUrl: apiData?.data?.content?.video?.playAddr,
      uniqueId: apiData?.data?.content?.author?.uniqueId,
      nickname: apiData?.data?.content?.author?.nickname,
      videoId: apiData?.data?.content?.id,
      videoDesc: apiData?.data?.content?.desc,
      coverUrl: apiData?.data?.content?.video?.cover,
      dynamicCover: apiData?.data?.content?.video?.dynamicCover,
      duration: apiData?.data?.content?.video?.duration,
      diggCount: apiData?.data?.content?.stats?.diggCount,
      shareCount: apiData?.data?.content?.stats?.shareCount,
      commentCount: apiData?.data?.content?.stats?.commentCount,
      playCount: apiData?.data?.content?.stats?.playCount,
    };

    if (!videoInfo.directVideoUrl) {
      console.error(
        "[Fetch Route Handler] Respons API eksternal tidak berisi 'data.content.video.playAddr'."
      );
      throw new Error(
        'Tidak dapat menemukan URL video dalam respons layanan eksternal.'
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        videoInfo 
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
