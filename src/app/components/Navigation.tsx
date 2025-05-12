'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">TikTok DL</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Single Download
              </Link>
              <Link
                href="/bulk"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/bulk'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Bulk Download
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="flex">
          <Link
            href="/"
            className={`flex-1 text-center py-2 px-3 text-sm font-medium ${
              pathname === '/'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600'
            }`}
          >
            Single Download
          </Link>
          <Link
            href="/bulk"
            className={`flex-1 text-center py-2 px-3 text-sm font-medium ${
              pathname === '/bulk'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600'
            }`}
          >
            Bulk Download
          </Link>
        </div>
      </div>
    </nav>
  );
}
