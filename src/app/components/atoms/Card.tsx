'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Card({ children, className = '', disabled = false }: CardProps) {
  return (
    <div 
      className={`
        bg-white p-6 rounded-lg shadow-md
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
