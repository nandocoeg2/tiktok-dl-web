'use client';

import { useState, FormEvent } from 'react';

interface BulkDownloadItem {
  id: string;
  url: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  videoInfo?: any;
}

export default function BulkDownload() {
  const [urls, setUrls] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadItems, setDownloadItems] = useState<BulkDownloadItem[]>([]);
  const [error, setError] = useState<string>('');
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  // Function to handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Split the URLs by newline and filter out empty lines
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      setError('Please enter at least one TikTok URL');
      return;
    }

    // Initialize download items
    const items: BulkDownloadItem[] = urlList.map((url, index) => ({
      id: `item-${Date.now()}-${index}`,
      url,
      status: 'pending',
      progress: 0,
    }));

    setDownloadItems(items);
    setIsProcessing(true);
    setSuccessCount(0);
    setFailedCount(0);

    // Process each URL sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Update status to fetching
      setDownloadItems((prevItems) =>
        prevItems.map((prevItem) =>
          prevItem.id === item.id
            ? { ...prevItem, status: 'fetching' }
            : prevItem
        )
      );

      try {
        // Fetch video information
        const fetchResponse = await fetch('/api/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: item.url }),
        });

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to fetch video info: Status ${fetchResponse.status}`
          );
        }

        const fetchData = await fetchResponse.json();
        const videoInfo = fetchData.videoInfo;

        // Update item with video info
        setDownloadItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? { ...prevItem, videoInfo, status: 'downloading' }
              : prevItem
          )
        );

        // Download the video
        const downloadResponse = await fetch('/api/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: item.url }),
        });

        if (!downloadResponse.ok) {
          const errorData = await downloadResponse.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to download video: Status ${downloadResponse.status}`
          );
        }

        // Get total size from Content-Length header
        const contentLength = downloadResponse.headers.get('content-length');
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

        // Create a reader from the response body stream
        const reader = downloadResponse.body?.getReader();
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

            // Update the progress for this specific item
            setDownloadItems((prevItems) =>
              prevItems.map((prevItem) =>
                prevItem.id === item.id ? { ...prevItem, progress } : prevItem
              )
            );
          }
        }

        // Combine all chunks into a single Uint8Array
        const allChunks = new Uint8Array(receivedSize);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }

        // Convert to blob
        const blob = new Blob([allChunks]);

        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const disposition = downloadResponse.headers.get('content-disposition');
        let filename = `tiktok_${videoInfo.author}_${videoInfo.video.id}.mp4`;

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

        // Update status to completed
        setDownloadItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? { ...prevItem, status: 'completed', progress: 100 }
              : prevItem
          )
        );

        setSuccessCount((prev) => prev + 1);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(`Error processing URL ${item.url}:`, err);

        // Update status to error
        setDownloadItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? { ...prevItem, status: 'error', error: errorMessage }
              : prevItem
          )
        );

        setFailedCount((prev) => prev + 1);
      }

      // Add a small delay between downloads to avoid overwhelming the server
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsProcessing(false);
  };

  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200 text-gray-800';
      case 'fetching':
        return 'bg-blue-200 text-blue-800';
      case 'downloading':
        return 'bg-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'error':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className='flex flex-col items-center justify-center py-2'>
      <div className='w-full max-w-4xl px-4 sm:px-6 lg:px-8'>
        <h1 className='text-4xl sm:text-5xl font-bold text-gray-800 mb-8 text-center'>
          Bulk TikTok Downloader
        </h1>

        <div className='bg-white p-6 rounded-lg shadow-md mb-8'>
          <h2 className='text-xl font-semibold mb-4 text-gray-800'>
            Enter TikTok URLs (one per line)
          </h2>

          <form onSubmit={handleSubmit}>
            <div className='mb-6'>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 h-40'
                placeholder='https://www.tiktok.com/@user/video/123...'
                disabled={isProcessing}
                required
              />
              <p className='mt-2 text-sm text-gray-500'>
                Enter one TikTok URL per line. Supports regular and shortened
                URLs.
              </p>
            </div>

            <button
              type='submit'
              disabled={isProcessing}
              className='w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isProcessing ? 'Processing...' : 'Start Bulk Download'}
            </button>

            {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
          </form>
        </div>

        {downloadItems.length > 0 && (
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-gray-800'>
                Download Queue
              </h2>
              <div className='text-sm'>
                <span className='text-green-600 font-medium'>
                  {successCount} completed
                </span>
                {' • '}
                <span className='text-red-600 font-medium'>
                  {failedCount} failed
                </span>
                {' • '}
                <span className='text-gray-600 font-medium'>
                  {downloadItems.length - successCount - failedCount} pending
                </span>
              </div>
            </div>

            <div className='space-y-4 max-h-96 overflow-y-auto'>
              {downloadItems.map((item) => (
                <div key={item.id} className='border rounded-lg p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <div className='truncate max-w-md'>
                      <a
                        href={item.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:underline'
                      >
                        {item.url}
                      </a>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.videoInfo && (
                    <div className='flex items-center mt-2 text-sm text-gray-600'>
                      <span className='font-medium'>
                        @{item.videoInfo.author}
                      </span>
                      {item.videoInfo.nickname && (
                        <span className='ml-1'>
                          ({item.videoInfo.nickname})
                        </span>
                      )}
                    </div>
                  )}

                  {item.status === 'downloading' && (
                    <div className='w-full bg-gray-200 rounded-full h-2.5 mt-2'>
                      <div
                        className='bg-blue-600 h-2.5 rounded-full'
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  )}

                  {item.error && (
                    <p className='mt-2 text-sm text-red-600'>{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
