'use client';

import React from 'react';
import VideoThumbnail from '../molecules/VideoThumbnail';
import StatItem from '../molecules/StatItem';

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
  author: string;
  nickname?: string;
  video: VideoDetails;
  description: string;
  stats: VideoStats;
  coverUrl: string;
  duration: number;
}

interface VideoInfoDisplayProps {
  videoInfo: VideoInfo;
  isMobile?: boolean;
  className?: string;
}

export default function VideoInfoDisplay({
  videoInfo,
  isMobile = false,
  className = '',
}: VideoInfoDisplayProps) {
  return (
    <div
      className={`${
        isMobile ? 'flex flex-col items-center' : 'flex items-start space-x-4'
      } ${className}`}
    >
      {videoInfo.coverUrl && (
        <VideoThumbnail
          src={videoInfo.coverUrl}
          duration={videoInfo.duration}
          className={
            isMobile ? 'mb-4 w-full max-w-[240px]' : 'w-1/3 flex-shrink-0'
          }
        />
      )}

      <div className={isMobile ? 'text-center' : 'flex-1 text-left'}>
        <h3 className='text-lg font-semibold mb-2 text-gray-800'>
          @{videoInfo.author} {videoInfo.nickname && `(${videoInfo.nickname})`}
        </h3>

        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
          {videoInfo.description || 'No description'}
        </p>

        <div className='text-xs text-gray-500 mb-2'>
          <span className='font-medium'>Video ID:</span> {videoInfo.video.id}
          <br />
          <span className='font-medium'>Created:</span>{' '}
          {new Date(
            parseInt(videoInfo.video.createTime) * 1000
          ).toLocaleDateString()}
        </div>

        <div
          className={`flex ${
            isMobile ? 'justify-center' : 'flex-wrap'
          } gap-3 mb-2 text-xs`}
        >
          <StatItem value={videoInfo.stats.playCount || 0} label='plays' />
          <StatItem value={videoInfo.stats.diggCount || 0} label='likes' />
          <StatItem
            value={videoInfo.stats.commentCount || 0}
            label='comments'
          />
          <StatItem
            value={parseInt(videoInfo.stats.collectCount) || 0}
            label='saves'
          />
        </div>
      </div>
    </div>
  );
}
