import React from 'react';
import { Skeleton } from './Skeleton';

export function GridSkeleton() {
  return (
    <div className="w-full max-w-[1920px] mx-auto px-6 py-12">
      <Skeleton className="h-16 w-64 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className="flex flex-col">
            <Skeleton className="w-full aspect-[2/3] mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
