import React from 'react';
import { Skeleton } from './Skeleton';

export function BookSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto px-6 py-12">
        <Skeleton className="h-4 w-16 mb-8" />
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-3 mb-10 lg:mb-0">
            <Skeleton className="w-full aspect-[2/3] mb-6" />
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 pl-0 lg:pl-4">
            <div className="flex justify-between items-start mb-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            
            <Skeleton className="h-6 w-1/3 mb-6" />
            <Skeleton className="h-5 w-48 mb-8" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <Skeleton className="h-4 w-4/5 mb-12" />

            <Skeleton className="h-8 w-64 mb-8" />
            <Skeleton className="h-40 w-full mb-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
