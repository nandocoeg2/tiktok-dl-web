'use client';

import React from 'react';
import Card from '../atoms/Card';
import StatusBadge from '../atoms/StatusBadge';

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
  stats?: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
    collectCount: string;
  };
}

interface HistoryItemProps {
  url: string;
  videoInfo?: VideoInfo;
  downloadedAt: Date | string;
  status?: string;
  className?: string;
}

export default function HistoryItem({
  url,
  videoInfo,
  downloadedAt,
  status = 'completed',
  className = '',
}: HistoryItemProps) {
  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Extract video ID and author from URL if videoInfo is undefined
  const extractVideoInfoFromUrl = (url: string): VideoInfo | null => {
    try {
      // Extract author and video ID from TikTok URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // TikTok URL format: https://www.tiktok.com/@username/video/1234567890
      let author = '';
      let videoId = '';

      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i].startsWith('@')) {
          author = pathParts[i].substring(1); // Remove @ symbol
        }
        if (pathParts[i] === 'video' && i + 1 < pathParts.length) {
          videoId = pathParts[i + 1];
        }
      }

      // Create a minimal VideoInfo object with the extracted data
      return {
        author,
        video: {
          id: videoId,
          createTime: '0',
        },
        description: '',
        stats: {
          diggCount: 0,
          shareCount: 0,
          commentCount: 0,
          playCount: 0,
          collectCount: '0',
        },
        coverUrl: '',
        duration: 0,
      };
    } catch {
      return null;
    }
  };

  // Use extracted info if videoInfo is undefined
  const displayInfo =
    videoInfo || (url && url !== '#' ? extractVideoInfoFromUrl(url) : null);

  return (
    <Card className={`mb-2 p-3 ${className}`}>
      <div className='flex items-center gap-2'>
        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex justify-between items-start'>
            <div className='truncate'>
              <div className='flex items-center gap-1'>
                <span className='font-medium truncate text-gray-800'>
                  {displayInfo?.author
                    ? `@${displayInfo.author}`
                    : 'TikTok Video'}
                </span>
                <StatusBadge
                  status={
                    status as
                      | 'pending'
                      | 'fetching'
                      | 'downloading'
                      | 'completed'
                      | 'error'
                      | 'default'
                  }
                  className='text-[10px] px-1.5 py-0.5'
                />
              </div>
              <div className='flex items-center text-xs text-gray-500 gap-2'>
                <span>{formatDate(downloadedAt)}</span>
                <span>•</span>
                <a
                  href={url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:underline truncate'
                >
                  {url}
                </a>
              </div>
            </div>
          </div>

          {displayInfo?.description && (
            <p className='text-xs text-gray-700 mt-1 line-clamp-1'>
              {displayInfo.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
