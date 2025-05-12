'use client';

import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingProps {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

export default function Heading({
  level = 1,
  children,
  className = '',
}: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const baseStyles = {
    1: 'text-4xl sm:text-5xl font-bold text-gray-800',
    2: 'text-3xl font-bold text-gray-800',
    3: 'text-2xl font-semibold text-gray-800',
    4: 'text-xl font-semibold text-gray-800',
    5: 'text-lg font-medium text-gray-800',
    6: 'text-base font-medium text-gray-800',
  };

  return (
    <Tag className={`${baseStyles[level]} ${className}`}>
      {children}
    </Tag>
  );
}
