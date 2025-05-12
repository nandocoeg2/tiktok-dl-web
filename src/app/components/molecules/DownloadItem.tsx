'use client';

import React from 'react';
import StatusBadge from '../atoms/StatusBadge';
import ProgressBar from '../atoms/ProgressBar';

interface VideoInfo {
  author: string;
  nickname?: string;
  [key: string]: any;
}

interface DownloadItemProps {
  url: string;
  status: 'pending' | 'fetching' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  videoInfo?: VideoInfo;
  className?: string;
}

export default function DownloadItem({
  url,
  status,
  progress,
  error,
  videoInfo,
  className = '',
}: DownloadItemProps) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="truncate max-w-md">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge status={status} />
      </div>

      {videoInfo && (
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <span className="font-medium">@{videoInfo.author}</span>
          {videoInfo.nickname && (
            <span className="ml-1">({videoInfo.nickname})</span>
          )}
        </div>
      )}

      {status === 'downloading' && (
        <ProgressBar progress={progress} className="mt-2" />
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
