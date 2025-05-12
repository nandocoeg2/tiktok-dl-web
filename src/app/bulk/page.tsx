'use client';

import { useState } from 'react';
import BulkDownloadTemplate from '../components/templates/BulkDownloadTemplate';

interface BulkDownloadItem {
  id: string;
  url: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  videoInfo?: any;
}

export default function BulkDownload() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadItems, setDownloadItems] = useState<BulkDownloadItem[]>([]);
  const [error, setError] = useState<string>('');
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  // Function to handle form submission
  const handleSubmit = async (urlList: string[]) => {
    setError('');

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

        // Create a download link for video
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

        // Download the thumbnail image if available
        if (videoInfo.coverUrl) {
          try {
            // Update status to show we're downloading the thumbnail
            setDownloadItems((prevItems) =>
              prevItems.map((prevItem) =>
                prevItem.id === item.id
                  ? { ...prevItem, status: 'downloading', progress: 100 }
                  : prevItem
              )
            );

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

  return (
    <BulkDownloadTemplate
      onSubmit={handleSubmit}
      isProcessing={isProcessing}
      error={error}
      downloadItems={downloadItems}
      successCount={successCount}
      failedCount={failedCount}
    />
  );
}
