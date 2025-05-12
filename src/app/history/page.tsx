'use client';

import { useState, useEffect } from 'react';
import HistoryTemplate from '../components/templates/HistoryTemplate';

interface VideoInfo {
  author: string;
  nickname?: string;
  video: {
    id: string;
    createTime: string;
  };
  description?: string;
  coverUrl?: string;
  duration?: number;
  directVideoUrl?: string;
}

interface HistoryItemData {
  _id: string;
  url?: string;
  originalUrl?: string;
  resolvedUrl?: string;
  videoInfo?: VideoInfo;
  createdAt?: Date | string;
  lastUpdatedAt?: Date | string;
  submittedAt?: Date | string;
  status?: string;
}

interface HistoryData {
  videos: HistoryItemData[];
  singleDownloads: HistoryItemData[];
  bulkDownloads: HistoryItemData[];
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryData>({
    videos: [],
    singleDownloads: [],
    bulkDownloads: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch history data
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/history');

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setHistoryData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch history data');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <HistoryTemplate
      videos={historyData.videos}
      singleDownloads={historyData.singleDownloads}
      bulkDownloads={historyData.bulkDownloads}
      isLoading={isLoading}
    />
  );
}
