'use client';

import { useState, FormEvent } from 'react';

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('');
    setError('');

    if (!url || !url.includes('tiktok.com')) {
      setError('Masukkan URL TikTok yang valid.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Gagal memulai download: Status ${response.status}`
        );
      }

      setStatus('Memulai download...');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = response.headers.get('content-disposition');
      let filename = 'tiktok_video.mp4';
      if (disposition && disposition.includes('attachment')) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setStatus('Download selesai!');
      setUrl('');
    } catch (err) {
      console.error('Error submitting URL:', err);
      setError('Terjadi kesalahan.');
      setStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100'>
      <main className='flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center'>
        <h1 className='text-4xl sm:text-5xl font-bold text-gray-800 mb-8'>
          TikTok Video Downloader
        </h1>

        <form
          onSubmit={handleSubmit}
          className='w-full max-w-lg bg-white p-8 rounded-lg shadow-md'
        >
          <div className='mb-6'>
            <label
              htmlFor='url'
              className='block mb-2 text-sm font-medium text-gray-700'
            >
              Masukkan URL Video TikTok:
            </label>
            <input
              type='url'
              id='url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
              placeholder='https://www.tiktok.com/@user/video/123...'
              required
              disabled={isLoading}
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <svg
                className='inline mr-3 w-5 h-5 text-white animate-spin'
                viewBox='0 0 24 24'
              >
                <path
                  fill='currentColor'
                  d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm1.5 17h-3v-2h3zm0-4h-3v-6h3z'
                />
              </svg>
            ) : (
              'Download Video'
            )}
          </button>

          {status && <p className='mt-4 text-sm text-green-600'>{status}</p>}
          {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
        </form>
        <footer className='mt-8 text-gray-500 text-sm'>Dibuat dengan ❤️</footer>
      </main>
    </div>
  );
}
