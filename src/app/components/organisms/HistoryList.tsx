'use client';

import React from 'react';
import HistoryItem from '../molecules/HistoryItem';
import Card from '../atoms/Card';

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
  items?: any[]; // For bulk downloads
}

interface HistoryListProps {
  videos: HistoryItemData[];
  singleDownloads: HistoryItemData[];
  bulkDownloads: HistoryItemData[];
  isLoading: boolean;
}

export default function HistoryList({
  videos,
  singleDownloads,
  bulkDownloads,
  isLoading,
}: HistoryListProps) {
  // Combine all data into a single array
  const getAllData = () => {
    // Combine all data and filter out items with "success" status
    const allData = [...videos, ...singleDownloads, ...bulkDownloads].filter(
      (item) => item.status !== 'success'
    );

    // Sort by date (newest first)
    allData.sort((a, b) => {
      const dateA = new Date(
        a.lastUpdatedAt || a.createdAt || a.submittedAt || 0
      );
      const dateB = new Date(
        b.lastUpdatedAt || b.createdAt || b.submittedAt || 0
      );
      return dateB.getTime() - dateA.getTime();
    });

    return allData;
  };

  return (
    <div>
      <Card className='mb-4 p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-lg font-semibold text-gray-800'>
            Download History
          </h2>
          <div className='text-sm text-gray-500'>
            Total: {getAllData().length}
          </div>
        </div>

        <div className='border-b mb-4'></div>

        {/* Loading state */}
        {isLoading ? (
          <div className='flex justify-center items-center py-6'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        ) : (
          <>
            {/* No data state */}
            {getAllData().length === 0 ? (
              <div className='text-center py-6 text-gray-500 text-sm'>
                No download history found
              </div>
            ) : (
              <>
                {/* History items */}
                <div className='space-y-1'>
                  {getAllData().map((item) => {
                    // Determine the type based on which array it's from
                    let type: 'video' | 'single' | 'bulk' = 'video';

                    // Simple heuristic to determine type
                    if (item.items) {
                      type = 'bulk';
                    } else if (item.originalUrl || item.resolvedUrl) {
                      type = 'single';
                    }

                    return (
                      <HistoryItem
                        key={item._id}
                        url={
                          item.url ||
                          item.originalUrl ||
                          item.resolvedUrl ||
                          '#'
                        }
                        videoInfo={item.videoInfo}
                        downloadedAt={
                          item.lastUpdatedAt ||
                          item.createdAt ||
                          item.submittedAt ||
                          new Date()
                        }
                        status={item.status || 'completed'}
                        type={type}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
