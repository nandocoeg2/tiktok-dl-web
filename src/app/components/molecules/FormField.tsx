'use client';

import React from 'react';
import Label from '../atoms/Label';
import Input from '../atoms/Input';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export default function FormField({
  id,
  label,
  type = 'text',
  required = false,
  error,
  className = '',
  inputProps = {},
}: FormFieldProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        error={error}
        required={required}
        {...inputProps}
      />
    </div>
  );
}
