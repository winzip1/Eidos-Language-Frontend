import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; heightClass?: string }> = ({
  count = 4,
  heightClass = 'h-16',
}) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full ${heightClass} bg-white border border-sand-200 rounded-2xl animate-pulse flex items-center p-4 gap-4`}
        >
          <div className="w-10 h-10 rounded-xl bg-sand-200/80 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-3.5 bg-sand-200/80 rounded" />
            <div className="w-2/3 h-2.5 bg-sand-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
