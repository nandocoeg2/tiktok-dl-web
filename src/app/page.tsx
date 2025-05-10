'use client';

import { useState, FormEvent } from 'react';

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
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [informationStatus, setInformationStatus] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const handleFetch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsFetching(true);
    setIsLoading(true);
    setInformationStatus('');
    setError('');
    setVideoInfo(null);

    if (!url || !url.includes('tiktok.com')) {
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
        body: JSON.stringify({ url }),
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
        body: JSON.stringify({ url }),
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100'>
      <main className='w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        <h1 className='text-4xl sm:text-5xl font-bold text-gray-800 mb-8 text-center'>
          TikTok Video Downloader
        </h1>

        {/* Desktop layout - Two columns */}
        <div className='flex flex-col lg:flex-row lg:space-x-8 space-y-6 lg:space-y-0'>
          {/* Left Section - Input URL and Get Information */}
          <div className='w-full lg:w-1/2'>
            <div className='bg-white p-6 rounded-lg shadow-md'>
              <h2 className='text-xl font-semibold mb-4 text-gray-800'>
                Step 1: Get Video Information
              </h2>

              <form onSubmit={handleFetch}>
                <div className='mb-6'>
                  <label
                    htmlFor='url'
                    className='block mb-2 text-sm font-medium text-gray-700'
                  >
                    Masukkan URL Video TikTok:
                  </label>
                  <input
                    type='url'
                    id='url'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
                    placeholder='https://www.tiktok.com/@user/video/123...'
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isFetching ? (
                    <svg
                      className='inline mr-3 w-5 h-5 text-white animate-spin'
                      viewBox='0 0 24 24'
                    >
                      <path
                        fill='currentColor'
                        d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1.5 17h-3v-2h3zm0-4h-3v-6h3z'
                      />
                    </svg>
                  ) : (
                    'Ambil Informasi Video'
                  )}
                </button>

                {informationStatus && (
                  <p className='mt-4 text-sm text-center text-green-600'>
                    {informationStatus}
                  </p>
                )}
                {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
              </form>

              {/* Video Information (Mobile Only) */}
              {videoInfo && (
                <div className='mt-6 pt-6 border-t lg:hidden'>
                  <div className='flex flex-col items-center'>
                    {videoInfo.coverUrl && (
                      <div className='mb-4 relative w-full max-w-[240px] rounded-lg overflow-hidden'>
                        <img
                          src={videoInfo.coverUrl}
                          alt='Video thumbnail'
                          className='w-full h-auto'
                        />
                        <div className='absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'>
                          {Math.floor(videoInfo.duration)}s
                        </div>
                      </div>
                    )}

                    <h3 className='text-lg font-semibold mb-2'>
                      @{videoInfo.author}{' '}
                      {videoInfo.nickname && `(${videoInfo.nickname})`}
                    </h3>

                    <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
                      {videoInfo.description || 'No description'}
                    </p>

                    <div className='text-xs text-gray-500 mb-3'>
                      <span className='font-medium'>Video ID:</span>{' '}
                      {videoInfo.video.id}
                      <br />
                      <span className='font-medium'>Created:</span>{' '}
                      {new Date(
                        parseInt(videoInfo.video.createTime) * 1000
                      ).toLocaleDateString()}
                    </div>

                    <div className='flex justify-center space-x-4 mb-4 text-xs text-gray-500'>
                      <div>
                        <span className='font-bold'>
                          {formatNumber(videoInfo.stats.playCount || 0)}
                        </span>{' '}
                        plays
                      </div>
                      <div>
                        <span className='font-bold'>
                          {formatNumber(videoInfo.stats.diggCount || 0)}
                        </span>{' '}
                        likes
                      </div>
                      <div>
                        <span className='font-bold'>
                          {formatNumber(videoInfo.stats.commentCount || 0)}
                        </span>{' '}
                        comments
                      </div>
                      <div>
                        <span className='font-bold'>
                          {formatNumber(
                            parseInt(videoInfo.stats.collectCount) || 0
                          )}
                        </span>{' '}
                        saves
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Download Video */}
          <div className='w-full lg:w-1/2'>
            <div
              className={`bg-white p-6 rounded-lg shadow-md h-full ${
                !videoInfo ? 'opacity-50' : ''
              }`}
            >
              <h2 className='text-xl font-semibold mb-4 text-gray-800'>
                Step 2: Download Video
              </h2>

              {!videoInfo ? (
                <div className='flex flex-col items-center justify-center h-64 text-gray-400'>
                  <svg
                    className='w-16 h-16 mb-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <p>Please fetch video information first</p>
                </div>
              ) : (
                <div className='flex flex-col'>
                  {/* Video Information (Desktop Only) */}
                  <div className='hidden lg:flex flex-col items-center mb-6'>
                    <div className='flex items-start space-x-4'>
                      {videoInfo.coverUrl && (
                        <div className='relative w-1/3 rounded-lg overflow-hidden flex-shrink-0'>
                          <img
                            src={videoInfo.coverUrl}
                            alt='Video thumbnail'
                            className='w-full h-auto'
                          />
                          <div className='absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'>
                            {Math.floor(videoInfo.duration)}s
                          </div>
                        </div>
                      )}

                      <div className='flex-1 text-left'>
                        <h3 className='text-lg font-semibold mb-2 text-black'>
                          @{videoInfo.author}{' '}
                          {videoInfo.nickname && `(${videoInfo.nickname})`}
                        </h3>

                        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                          {videoInfo.description || 'No description'}
                        </p>

                        <div className='text-xs text-gray-500 mb-2'>
                          <span className='font-medium'>Video ID:</span>{' '}
                          {videoInfo.video.id}
                          <br />
                          <span className='font-medium'>Created:</span>{' '}
                          {new Date(
                            parseInt(videoInfo.video.createTime) * 1000
                          ).toLocaleDateString()}
                        </div>

                        <div className='flex flex-wrap gap-3 mb-2 text-xs text-gray-500'>
                          <div>
                            <span className='font-bold'>
                              {formatNumber(videoInfo.stats.playCount || 0)}
                            </span>{' '}
                            plays
                          </div>
                          <div>
                            <span className='font-bold'>
                              {formatNumber(videoInfo.stats.diggCount || 0)}
                            </span>{' '}
                            likes
                          </div>
                          <div>
                            <span className='font-bold'>
                              {formatNumber(videoInfo.stats.commentCount || 0)}
                            </span>{' '}
                            comments
                          </div>
                          <div>
                            <span className='font-bold'>
                              {formatNumber(
                                parseInt(videoInfo.stats.collectCount) || 0
                              )}
                            </span>{' '}
                            saves
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col space-y-4 text-center'>
                    {/* Download Progress */}
                    {isDownloading &&
                    downloadProgress > 0 &&
                    downloadProgress < 100 ? (
                      <div className='w-full mb-4'>
                        <div className='w-full bg-gray-200 rounded-full h-2.5 mb-2'>
                          <div
                            className='bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-in-out'
                            style={{ width: `${downloadProgress}%` }}
                          ></div>
                        </div>
                        <p className='text-xs text-gray-500'>
                          {downloadProgress}% Downloaded
                        </p>
                      </div>
                    ) : null}

                    {downloadStatus && (
                      <p className='mt-4 text-sm text-green-600'>
                        {downloadStatus}
                      </p>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={handleDownload}
                      disabled={isLoading}
                      className='w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed mt-auto'
                    >
                      {isDownloading ? (
                        <>
                          <svg
                            className='inline mr-3 w-5 h-5 text-white animate-spin'
                            viewBox='0 0 24 24'
                          >
                            <path
                              fill='currentColor'
                              d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1.5 17h-3v-2h3zm0-4h-3v-6h3z'
                            />
                          </svg>
                          {downloadProgress > 0 && downloadProgress < 100
                            ? `Downloading... ${downloadProgress}%`
                            : 'Preparing Download...'}
                        </>
                      ) : (
                        'Download Video'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className='mt-8 text-gray-500 text-sm text-center'>
          Dibuat dengan ❤️
        </footer>
      </main>
    </div>
  );
}
