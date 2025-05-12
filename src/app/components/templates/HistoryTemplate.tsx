'use client';

import React from 'react';
import Heading from '../atoms/Heading';
import HistoryList from '../organisms/HistoryList';

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

interface HistoryTemplateProps {
  videos: HistoryItemData[];
  singleDownloads: HistoryItemData[];
  bulkDownloads: HistoryItemData[];
  isLoading: boolean;
}

export default function HistoryTemplate({
  videos,
  singleDownloads,
  bulkDownloads,
  isLoading,
}: HistoryTemplateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-2'>
      <div className='w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        <Heading level={1} className='mb-8 text-center'>
          TikTok Download History
        </Heading>

        <HistoryList
          videos={videos}
          singleDownloads={singleDownloads}
          bulkDownloads={bulkDownloads}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
