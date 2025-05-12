'use client';

import React from 'react';

interface StatItemProps {
  value: number | string;
  label: string;
  className?: string;
}

export default function StatItem({
  value,
  label,
  className = '',
}: StatItemProps) {
  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const displayValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className={className}>
      <span className='font-bold text-gray-500'>{displayValue}</span>{' '}
      <span className='text-gray-500'>{label}</span>
    </div>
  );
}
