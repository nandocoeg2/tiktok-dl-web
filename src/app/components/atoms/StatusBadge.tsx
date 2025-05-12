'use client';

import React from 'react';

type StatusType = 'pending' | 'fetching' | 'downloading' | 'completed' | 'error' | 'default';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  children?: React.ReactNode;
}

const statusStyles = {
  pending: 'bg-gray-200 text-gray-800',
  fetching: 'bg-blue-200 text-blue-800',
  downloading: 'bg-yellow-200 text-yellow-800',
  completed: 'bg-green-200 text-green-800',
  error: 'bg-red-200 text-red-800',
  default: 'bg-gray-200 text-gray-800',
};

export default function StatusBadge({
  status,
  className = '',
  children,
}: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.default;

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${style} ${className}`}>
      {children || status}
    </span>
  );
}
