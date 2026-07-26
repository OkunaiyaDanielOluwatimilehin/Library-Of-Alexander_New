import React from 'react';
import { Skeleton } from './Skeleton';

export function HomeSkeleton() {
  return (
    <div className="pb-12 bg-white flex flex-col items-center min-h-screen">
      {/* Hero Section Skeleton */}
      <section className="relative w-full max-w-[1920px] bg-gray-200 overflow-hidden mb-12 flex items-center py-16 md:py-24">
        <div className="relative w-full max-w-[1920px] mx-auto px-6">
          <div className="max-w-3xl">
            <Skeleton className="h-16 w-3/4 mb-6 bg-gray-300" />
            <Skeleton className="h-6 w-full mb-4 bg-gray-300" />
            <Skeleton className="h-6 w-5/6 mb-8 bg-gray-300" />
            <Skeleton className="h-10 w-40 bg-gray-300" />
          </div>
        </div>
      </section>

      {/* Main Content Skeleton */}
      <div className="w-full max-w-[1920px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-8">
          <Skeleton className="h-12 w-64 mb-6" />
          
          {/* Books grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex flex-col">
                <Skeleton className="w-full aspect-[2/3] mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>

          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-16">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col">
                <Skeleton className="w-full aspect-[2/3] mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-4">
          <Skeleton className="h-12 w-48 mb-6" />
          <div className="space-y-4 mb-12">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i}><Skeleton className="h-10 w-full" /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
