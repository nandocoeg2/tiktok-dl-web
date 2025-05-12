'use client';

import React from 'react';

interface VideoThumbnailProps {
  src: string;
  duration: number;
  className?: string;
  alt?: string;
}

export default function VideoThumbnail({
  src,
  duration,
  className = '',
  alt = 'Video thumbnail',
}: VideoThumbnailProps) {
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-auto"
      />
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
        {Math.floor(duration)}s
      </div>
    </div>
  );
}
