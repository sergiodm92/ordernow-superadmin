'use client';

import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { useLoadingStore } from '@/store/loading';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const GlobalLoading = () => {
  const { isLoading: navLoading, loadingMessage: navMessage } = useNavigationLoading();
  const { isLoading: globalLoading, loadingMessage: globalMessage } = useLoadingStore();

  const isLoading = navLoading || globalLoading;
  const loadingMessage = globalLoading ? globalMessage : navMessage;
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isLoading) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
    } else {
      setProgress(100);
      timeoutRef.current = setTimeout(() => setProgress(0), 300);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="fixed inset-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-green-200 dark:border-green-800 rounded-full animate-pulse" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {loadingMessage}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Por favor espera un momento
            </p>
          </div>

          <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalLoading;
