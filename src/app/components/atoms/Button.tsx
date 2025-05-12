'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-300 text-white',
  success: 'bg-green-600 hover:bg-green-700 focus:ring-green-300 text-white',
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-300 text-white',
};

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-6 py-3',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        font-medium rounded-lg focus:ring-4 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="inline mr-3 w-5 h-5 text-white animate-spin"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1.5 17h-3v-2h3zm0-4h-3v-6h3z"
            />
          </svg>
          {typeof children === 'string' ? 'Loading...' : children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
