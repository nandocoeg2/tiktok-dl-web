'use client';

import React, { FormEvent, useState } from 'react';
import Card from '../atoms/Card';
import CardHeader from '../molecules/CardHeader';
import FormField from '../molecules/FormField';
import Button from '../atoms/Button';

interface UrlInputFormProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
  status?: string;
  error?: string;
}

export default function UrlInputForm({
  onSubmit,
  isLoading,
  status,
  error,
}: UrlInputFormProps) {
  const [url, setUrl] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (url.trim()) {
      await onSubmit(url.trim());
    }
  };

  return (
    <Card>
      <CardHeader title='Step 1: Get Video Information' />

      <form onSubmit={handleSubmit}>
        <FormField
          id='url'
          label='Enter TikTok Video URL'
          type='url'
          required
          error={error}
          inputProps={{
            value: url,
            onChange: (e) => setUrl(e.target.value),
            placeholder: 'https://www.tiktok.com/@user/video/123...',
            disabled: isLoading,
          }}
        />

        <Button
          type='submit'
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          Get Video Information
        </Button>

        {status && (
          <p className='mt-4 text-sm text-center text-green-600'>{status}</p>
        )}
      </form>
    </Card>
  );
}
