'use client';

import React from 'react';
import Card from '../atoms/Card';
import CardHeader from '../molecules/CardHeader';
import Button from '../atoms/Button';
import ProgressBar from '../atoms/ProgressBar';
import VideoInfoDisplay from './VideoInfoDisplay';

interface VideoInfo {
  author: string;
  nickname?: string;
  video: {
    id: string;
    createTime: string;
  };
  description: string;
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
    collectCount: string;
  };
  coverUrl: string;
  duration: number;
}

interface DownloadSectionProps {
  videoInfo: VideoInfo | null;
  isDownloading: boolean;
  downloadProgress: number;
  downloadStatus: string;
  onDownload: () => Promise<void>;
  isLoading: boolean;
}

export default function DownloadSection({
  videoInfo,
  isDownloading,
  downloadProgress,
  downloadStatus,
  onDownload,
  isLoading,
}: DownloadSectionProps) {
  return (
    <Card disabled={!videoInfo}>
      <CardHeader title="Step 2: Download Video" />

      {!videoInfo ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Please fetch video information first</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Video Information (Desktop Only) */}
          <div className="hidden lg:block mb-6">
            <VideoInfoDisplay videoInfo={videoInfo} />
          </div>

          <div className="flex flex-col space-y-4 text-center">
            {/* Download Progress */}
            {isDownloading && downloadProgress > 0 && downloadProgress < 100 && (
              <ProgressBar progress={downloadProgress} />
            )}

            {downloadStatus && (
              <p className="mt-4 text-sm text-green-600">{downloadStatus}</p>
            )}

            {/* Download Button */}
            <Button
              variant="success"
              onClick={onDownload}
              disabled={isLoading}
              isLoading={isDownloading}
              fullWidth
            >
              {isDownloading && downloadProgress > 0 && downloadProgress < 100
                ? `Downloading... ${downloadProgress}%`
                : 'Download Video & Thumbnail'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
