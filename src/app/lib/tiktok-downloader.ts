// lib/tiktok-downloader.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const TT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';

export async function getVideoUrlFromTikTok(
  tiktokPageUrl: string
): Promise<string> {
  try {
    console.log(`[tiktok-downloader] Mengambil data dari: ${tiktokPageUrl}`);

    const response = await axios.get(tiktokPageUrl, {
      headers: {
        'User-Agent': TT_USER_AGENT,
        Referer: 'https://www.tiktok.com/',
      },
      maxRedirects: 5,
    });

    if (response.status !== 200) {
      throw new Error(
        `Gagal mengambil halaman TikTok: Status ${response.status}`
      );
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawJsonData: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let jsonData: any = null;
    let foundData = false;
    const targetScriptIds = [
      '__NEXT_DATA__',
      '__UNIVERSAL_DATA_FOR_REHYDRATION__',
      'SIGI_STATE',
    ];

    console.log(
      '[tiktok-downloader] Mencari script tags:',
      targetScriptIds.join(', ')
    );

    $('script').each((index, element) => {
      const scriptId = $(element).attr('id');
      if (scriptId && targetScriptIds.includes(scriptId)) {
        const scriptContent = $(element).html();
        if (scriptContent) {
          try {
            rawJsonData = JSON.parse(scriptContent);
            console.log(
              `[tiktok-downloader] Data JSON mentah ditemukan dan di-parse dari script id="${scriptId}"`
            );

            if (rawJsonData && rawJsonData.__DEFAULT_SCOPE__) {
              console.log(
                "[tiktok-downloader] Data utama terdeteksi berada di dalam '__DEFAULT_SCOPE__'. Menggunakan scope tersebut."
              );
              jsonData = rawJsonData.__DEFAULT_SCOPE__;
            } else {
              console.log(
                '[tiktok-downloader] Data utama tampaknya berada di level atas JSON mentah.'
              );
              jsonData = rawJsonData;
            }

            foundData = true;
            return false;
          } catch (e) {
            console.warn(
              `[tiktok-downloader] Gagal parse JSON dari script id="${scriptId}"`,
              e
            );
          }
        }
      }
    });

    if (!foundData) {
      console.log(
        '[tiktok-downloader] Tidak menemukan JSON di script ID target, mencoba mencari script lain...'
      );
      $('script').each((index, element) => {
        const scriptContent = $(element).html();
        if (scriptContent) {
          try {
            rawJsonData = JSON.parse(scriptContent);
            console.log(
              '[tiktok-downloader] Data JSON mentah ditemukan dan di-parse dari script tanpa ID'
            );
            jsonData = rawJsonData;
            foundData = true;
            return false;
          } catch (e) {
            console.warn(
              '[tiktok-downloader] Gagal parse JSON dari script tanpa ID',
              e
            );
          }
        }
      });
    }

    if (!foundData || !jsonData) {
      throw new Error(
        'Tidak dapat menemukan atau parse data JSON video yang relevan di dalam HTML halaman.'
      );
    }

    console.log(
      '[tiktok-downloader] --- Struktur JSON yang Akan Digunakan (Sebagian) ---'
    );
    console.log('Top-level keys dalam jsonData:', Object.keys(jsonData));

    if (jsonData['webapp.video-detail']) {
      console.log(
        "jsonData['webapp.video-detail'] keys:",
        Object.keys(jsonData['webapp.video-detail'])
      );
      const videoDetail = jsonData['webapp.video-detail'];
      if (videoDetail.itemInfo?.itemStruct) {
        console.log(
          "jsonData['webapp.video-detail'].itemInfo.itemStruct keys:",
          Object.keys(videoDetail.itemInfo.itemStruct)
        );
        if (videoDetail.itemInfo.itemStruct.video) {
          console.log(
            "jsonData['webapp.video-detail'].itemInfo.itemStruct.video keys:",
            Object.keys(videoDetail.itemInfo.itemStruct.video)
          );
        }
      }
    } else if (jsonData.ItemModule) {
      console.log(
        'jsonData.ItemModule keys:',
        Object.keys(jsonData.ItemModule)
      );
      const firstItemKey = Object.keys(jsonData.ItemModule)[0];
      if (firstItemKey && jsonData.ItemModule[firstItemKey]?.video) {
        console.log(
          `jsonData.ItemModule['${firstItemKey}'].video keys:`,
          Object.keys(jsonData.ItemModule[firstItemKey].video)
        );
      }
    }
    console.log('[tiktok-downloader] --- Akhir Struktur JSON (Sebagian) ---');

    let videoUrl = '';
    let videoId = '';
    let description = '';

    try {
      const itemStruct = jsonData['webapp.video-detail']?.itemInfo?.itemStruct;
      if (itemStruct) {
        console.log(
          "[tiktok-downloader] Mencoba ekstraksi dari jsonData['webapp.video-detail'].itemInfo.itemStruct"
        );
        videoId = itemStruct.id || videoId;
        description = itemStruct.desc || description;
        videoUrl =
          itemStruct.video?.playAddr || itemStruct.video?.downloadAddr || '';
        if (videoUrl) {
          console.log(
            '[tiktok-downloader] URL ditemukan via webapp.video-detail:',
            videoUrl
          );
        }
      }

      if (!videoUrl && jsonData.ItemModule) {
        console.log(
          '[tiktok-downloader] Mencoba ekstraksi dari jsonData.ItemModule (dalam scope)'
        );
        const itemModuleKeys = Object.keys(jsonData.ItemModule);
        if (itemModuleKeys.length > 0) {
          const itemKey =
            itemModuleKeys.find((k) => /^\d+$/.test(k)) || itemModuleKeys[0];
          const item = jsonData.ItemModule[itemKey];
          if (item) {
            videoId = item.id || videoId;
            description = item.desc || description;
            videoUrl = item.video?.playAddr || item.video?.downloadAddr || '';
            if (videoUrl) {
              console.log(
                '[tiktok-downloader] URL ditemukan via ItemModule (dalam scope):',
                videoUrl
              );
            }
          }
        }
      }
    } catch (extractError) {
      console.error(
        '[tiktok-downloader] Error saat mencoba mengekstrak data dari JSON:',
        extractError
      );
    }

    if (!videoUrl) {
      console.error(
        '[tiktok-downloader] GAGAL: URL video (playAddr/downloadAddr) tidak ditemukan setelah mencoba path yang diketahui dalam struktur JSON.'
      );
      throw new Error(
        'URL video tidak ditemukan dalam struktur data JSON yang diekstrak.'
      );
    }

    console.log(`[tiktok-downloader] Hasil Akhir - Deskripsi: ${description}`);
    console.log(`[tiktok-downloader] Hasil Akhir - Video ID: ${videoId}`);
    console.log(`[tiktok-downloader] Hasil Akhir - URL Video: ${videoUrl}`);

    return videoUrl;
  } catch (error) {
    console.error(
      '[tiktok-downloader] Gagal mengambil URL video dari TikTok:',
      error
    );
    throw new Error(`Gagal mengambil URL video dari halaman TikTok`);
  }
}
