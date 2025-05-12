'use client';

import React from 'react';
import Label from '../atoms/Label';
import TextArea from '../atoms/TextArea';

interface TextAreaFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  textAreaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  helpText?: string;
}

export default function TextAreaField({
  id,
  label,
  required = false,
  error,
  className = '',
  textAreaProps = {},
  helpText,
}: TextAreaFieldProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <TextArea
        id={id}
        error={error}
        required={required}
        {...textAreaProps}
      />
      {helpText && <p className="mt-2 text-sm text-gray-500">{helpText}</p>}
    </div>
  );
}
