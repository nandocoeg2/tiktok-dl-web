'use client';

import React from 'react';
import Card from '../atoms/Card';
import CardHeader from '../molecules/CardHeader';
import DownloadItem from '../molecules/DownloadItem';

interface BulkDownloadItem {
  id: string;
  url: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  videoInfo?: any;
}

interface DownloadQueueProps {
  items: BulkDownloadItem[];
  successCount: number;
  failedCount: number;
  className?: string;
}

export default function DownloadQueue({
  items,
  successCount,
  failedCount,
  className = '',
}: DownloadQueueProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <div className="flex justify-between items-center mb-4">
        <CardHeader title="Download Queue" className="mb-0" />
        <div className="text-sm">
          <span className="text-green-600 font-medium">
            {successCount} completed
          </span>
          {' • '}
          <span className="text-red-600 font-medium">
            {failedCount} failed
          </span>
          {' • '}
          <span className="text-gray-600 font-medium">
            {items.length - successCount - failedCount} pending
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <DownloadItem
            key={item.id}
            url={item.url}
            status={item.status}
            progress={item.progress}
            error={item.error}
            videoInfo={item.videoInfo}
          />
        ))}
      </div>
    </Card>
  );
}
