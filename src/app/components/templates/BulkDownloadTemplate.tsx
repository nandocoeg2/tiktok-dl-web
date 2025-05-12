'use client';

import React from 'react';
import Heading from '../atoms/Heading';
import BulkUrlInputForm from '../organisms/BulkUrlInputForm';
import DownloadQueue from '../organisms/DownloadQueue';

interface BulkDownloadItem {
  id: string;
  url: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  videoInfo?: any;
}

interface BulkDownloadTemplateProps {
  onSubmit: (urls: string[]) => Promise<void>;
  isProcessing: boolean;
  error: string;
  downloadItems: BulkDownloadItem[];
  successCount: number;
  failedCount: number;
}

export default function BulkDownloadTemplate({
  onSubmit,
  isProcessing,
  error,
  downloadItems,
  successCount,
  failedCount,
}: BulkDownloadTemplateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Heading level={1} className="mb-8 text-center">
          Bulk TikTok Downloader
        </Heading>

        <BulkUrlInputForm
          onSubmit={onSubmit}
          isProcessing={isProcessing}
          error={error}
        />

        <DownloadQueue
          items={downloadItems}
          successCount={successCount}
          failedCount={failedCount}
        />
      </div>
    </div>
  );
}
