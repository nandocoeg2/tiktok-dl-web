'use client';

import React from 'react';
import Heading from '../atoms/Heading';
import UrlInputForm from '../organisms/UrlInputForm';
import DownloadSection from '../organisms/DownloadSection';
import VideoInfoDisplay from '../organisms/VideoInfoDisplay';

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
  directVideoUrl: string;
}

interface SingleDownloadTemplateProps {
  onFetch: (url: string) => Promise<void>;
  onDownload: () => Promise<void>;
  isLoading: boolean;
  isFetching: boolean;
  isDownloading: boolean;
  informationStatus: string;
  downloadStatus: string;
  error: string;
  videoInfo: VideoInfo | null;
  downloadProgress: number;
}

export default function SingleDownloadTemplate({
  onFetch,
  onDownload,
  isLoading,
  isFetching,
  isDownloading,
  informationStatus,
  downloadStatus,
  error,
  videoInfo,
  downloadProgress,
}: SingleDownloadTemplateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Heading level={1} className="mb-8 text-center">
          TikTok Video Downloader
        </Heading>

        {/* Desktop layout - Two columns */}
        <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-6 lg:space-y-0">
          {/* Left Section - Input URL and Get Information */}
          <div className="w-full lg:w-1/2">
            <UrlInputForm
              onSubmit={onFetch}
              isLoading={isFetching}
              status={informationStatus}
              error={error}
            />

            {/* Video Information (Mobile Only) */}
            {videoInfo && (
              <div className="mt-6 pt-6 border-t lg:hidden">
                <VideoInfoDisplay videoInfo={videoInfo} isMobile={true} />
              </div>
            )}
          </div>

          {/* Right Section - Download Video */}
          <div className="w-full lg:w-1/2">
            <DownloadSection
              videoInfo={videoInfo}
              isDownloading={isDownloading}
              downloadProgress={downloadProgress}
              downloadStatus={downloadStatus}
              onDownload={onDownload}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
