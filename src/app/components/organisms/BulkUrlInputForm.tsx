'use client';

import React, { FormEvent, useState } from 'react';
import Card from '../atoms/Card';
import CardHeader from '../molecules/CardHeader';
import TextAreaField from '../molecules/TextAreaField';
import Button from '../atoms/Button';

interface BulkUrlInputFormProps {
  onSubmit: (urls: string[]) => Promise<void>;
  isProcessing: boolean;
  error?: string;
}

export default function BulkUrlInputForm({
  onSubmit,
  isProcessing,
  error,
}: BulkUrlInputFormProps) {
  const [urls, setUrls] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Split the URLs by newline and filter out empty lines
    const urlList = urls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    
    if (urlList.length > 0) {
      await onSubmit(urlList);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader title="Enter TikTok URLs (one per line)" />
      
      <form onSubmit={handleSubmit}>
        <TextAreaField
          id="urls"
          label="TikTok URLs"
          required
          error={error}
          helpText="Enter one TikTok URL per line. Supports regular and shortened URLs."
          textAreaProps={{
            value: urls,
            onChange: (e) => setUrls(e.target.value),
            placeholder: 'https://www.tiktok.com/@user/video/123...',
            disabled: isProcessing,
            className: 'h-40',
          }}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isProcessing}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Start Bulk Download (Videos & Thumbnails)'}
        </Button>
      </form>
    </Card>
  );
}
