'use client';

import { useState } from 'react';
import SingleDownloadTemplate from './components/templates/SingleDownloadTemplate';

interface VideoStats {
  diggCount: number;
  shareCount: number;
  commentCount: number;
  playCount: number;
  collectCount: string;
}

interface VideoDetails {
  id: string;
  createTime: string;
}

interface VideoInfo {
  directVideoUrl: string;
  author: string;
  nickname: string;
  video: VideoDetails;
  description: string;
  stats: VideoStats;
  coverUrl: string;
  dynamicCover?: string;
  duration: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [informationStatus, setInformationStatus] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const handleFetch = async (inputUrl: string) => {
    setIsFetching(true);
    setIsLoading(true);
    setInformationStatus('');
    setError('');
    setVideoInfo(null);

    if (!inputUrl || !inputUrl.includes('tiktok.com')) {
      setError('Masukkan URL TikTok yang valid.');
      setIsLoading(false);
      setIsFetching(false);
      return;
    }

    try {
      setInformationStatus('Mengambil informasi video...');

      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Gagal mengambil informasi: Status ${response.status}`
        );
      }

      const data = await response.json();
      setVideoInfo(data.videoInfo);
      setInformationStatus('Informasi video berhasil diambil');
    } catch (err) {
      console.error('Error fetching video info:', err);
      setError('Gagal mengambil informasi video.');
      setInformationStatus('');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setIsDownloading(true);
    setIsLoading(true);
    setDownloadStatus('Memulai download...');
    setError('');
    setDownloadProgress(0);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoInfo.directVideoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Gagal memulai download: Status ${response.status}`
        );
      }

      // Get total size from Content-Length header
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

      // Create a reader from the response body stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body stream is not available');
      }

      // Create an array to hold the chunks
      const chunks: Uint8Array[] = [];
      let receivedSize = 0;

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Add the chunk to our array
        chunks.push(value);
        receivedSize += value.length;

        // Calculate and update progress
        if (totalSize > 0) {
          const progress = Math.round((receivedSize / totalSize) * 100);
          setDownloadProgress(progress);
          setDownloadStatus(`Downloading... ${progress}%`);
        }
      }

      // Combine all chunks into a single Uint8Array
      const allChunks = new Uint8Array(receivedSize);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Convert to blob and download
      const blob = new Blob([allChunks]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = response.headers.get('content-disposition');
      let filename = 'tiktok_video.mp4';
      if (disposition && disposition.includes('attachment')) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Download the thumbnail image if available
      if (videoInfo && videoInfo.coverUrl) {
        try {
          setDownloadStatus('Downloading thumbnail...');

          // Fetch the thumbnail image
          const imageResponse = await fetch(videoInfo.coverUrl);

          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const imageUrl = window.URL.createObjectURL(imageBlob);
            const imageLink = document.createElement('a');
            const imageFilename = `tiktok_${videoInfo.author}_${videoInfo.video.id}_thumbnail.jpg`;

            imageLink.href = imageUrl;
            imageLink.download = imageFilename;
            document.body.appendChild(imageLink);
            imageLink.click();
            imageLink.remove();
            window.URL.revokeObjectURL(imageUrl);

            console.log(
              `Downloaded thumbnail for video: ${videoInfo.video.id}`
            );
          } else {
            console.error(
              `Failed to download thumbnail: ${imageResponse.status}`
            );
          }
        } catch (imageError) {
          console.error('Error downloading thumbnail:', imageError);
          // Continue even if thumbnail download fails
        }
      }

      setDownloadStatus('Download selesai!');
      setDownloadProgress(100);
    } catch (err) {
      console.error('Error downloading video:', err);
      setError('Terjadi kesalahan saat download.');
      setDownloadStatus('');
    } finally {
      setIsLoading(false);
      setIsDownloading(false);
    }
  };

  return (
    <SingleDownloadTemplate
      onFetch={handleFetch}
      onDownload={handleDownload}
      isLoading={isLoading}
      isFetching={isFetching}
      isDownloading={isDownloading}
      informationStatus={informationStatus}
      downloadStatus={downloadStatus}
      error={error}
      videoInfo={videoInfo}
      downloadProgress={downloadProgress}
    />
  );
}
