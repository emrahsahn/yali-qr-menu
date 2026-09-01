"use client"

import React from "react"

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col flex-1 p-4 gap-4 animate-pulse max-w-[480px] mx-auto w-full">
      {/* Category Nav skeleton */}
      <div className="h-12 w-full bg-muted rounded-2xl" />
      <div className="flex gap-2 overflow-x-hidden py-1">
        <div className="h-8 w-24 bg-muted rounded-full flex-shrink-0" />
        <div className="h-8 w-32 bg-muted rounded-full flex-shrink-0" />
        <div className="h-8 w-20 bg-muted rounded-full flex-shrink-0" />
        <div className="h-8 w-28 bg-muted rounded-full flex-shrink-0" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-3 rounded-2xl border border-white/10 dark:border-black/10 bg-white/20 dark:bg-black/10"
          >
            <div className="aspect-[4/3] w-full bg-muted rounded-xl" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
            <div className="flex justify-between items-center mt-2">
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
