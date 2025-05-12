'use client';

import React from 'react';
import Heading from '../atoms/Heading';

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function CardHeader({
  title,
  subtitle,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <Heading level={4} className="mb-1">
        {title}
      </Heading>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}
