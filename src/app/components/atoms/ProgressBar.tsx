'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  showPercentage = true,
  className = '',
}: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${safeProgress}%` }}
        ></div>
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-500">{Math.round(safeProgress)}% Downloaded</p>
      )}
    </div>
  );
}
