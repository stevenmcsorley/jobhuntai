import React from 'react';

const SkeletonLoader = ({ type = 'default', count = 1, className = '' }) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer rounded';

  const skeletonTypes = {
    // Basic shapes
    line: 'h-4 w-full',
    'line-short': 'h-4 w-3/4',
    'line-medium': 'h-4 w-1/2',
    'line-long': 'h-4 w-5/6',
    circle: 'h-12 w-12 rounded-full',
    'circle-sm': 'h-8 w-8 rounded-full',
    'circle-lg': 'h-16 w-16 rounded-full',
    rectangle: 'h-24 w-full',
    square: 'h-24 w-24',
    
    // Job card skeleton
    jobCard: (
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className={`${baseClasses} h-6 w-3/4`}></div>
            <div className={`${baseClasses} h-4 w-1/2`}></div>
            <div className={`${baseClasses} h-4 w-2/3`}></div>
          </div>
          <div className={`${baseClasses} h-8 w-16`}></div>
        </div>
        <div className="flex space-x-2">
          <div className={`${baseClasses} h-6 w-20`}></div>
          <div className={`${baseClasses} h-6 w-16`}></div>
          <div className={`${baseClasses} h-6 w-24`}></div>
        </div>
      </div>
    ),

    // Table row skeleton
    tableRow: (
      <tr className="border-b border-neutral-200 dark:border-slate-700">
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-full`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-3/4`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-1/2`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-16`}></div>
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-6 w-12`}></div>
        </td>
      </tr>
    ),

    // Stats card skeleton
    statsCard: (
      <div className="surface-card p-6 text-center space-y-3">
        <div className={`${baseClasses} h-12 w-12 rounded-full mx-auto`}></div>
        <div className={`${baseClasses} h-5 w-24 mx-auto`}></div>
        <div className={`${baseClasses} h-8 w-16 mx-auto`}></div>
      </div>
    ),

    // Chart skeleton
    chart: (
      <div className="surface-card p-6 space-y-4">
        <div className={`${baseClasses} h-6 w-1/3`}></div>
        <div className="relative h-64 flex items-end justify-center space-x-2">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`${baseClasses} w-8`}
              style={{ height: `${Math.random() * 60 + 40}%` }}
            ></div>
          ))}
        </div>
      </div>
    ),

    // Header skeleton
    header: (
      <div className="surface-card-elevated p-8 space-y-6">
        <div className="space-y-3">
          <div className={`${baseClasses} h-10 w-1/2`}></div>
          <div className="flex items-center space-x-2">
            <div className={`${baseClasses} h-2 w-2 rounded-full`}></div>
            <div className={`${baseClasses} h-4 w-1/3`}></div>
          </div>
        </div>
        <div className="flex space-x-3">
          <div className={`${baseClasses} h-10 w-24`}></div>
          <div className={`${baseClasses} h-10 w-20`}></div>
          <div className={`${baseClasses} h-10 w-28`}></div>
        </div>
      </div>
    ),

    // Profile section skeleton
    profile: (
      <div className="surface-card p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className={`${baseClasses} h-16 w-16 rounded-full`}></div>
          <div className="flex-1 space-y-2">
            <div className={`${baseClasses} h-6 w-1/2`}></div>
            <div className={`${baseClasses} h-4 w-3/4`}></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className={`${baseClasses} h-4 w-full`}></div>
          <div className={`${baseClasses} h-4 w-5/6`}></div>
          <div className={`${baseClasses} h-4 w-2/3`}></div>
        </div>
      </div>
    ),

    // Test session skeleton
    testSession: (
      <div className="surface-card p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <div className={`${baseClasses} h-4 w-20`}></div>
            <div className={`${baseClasses} h-4 w-16`}></div>
          </div>
          <div className={`${baseClasses} h-4 w-24`}></div>
        </div>
        <div className="space-y-4">
          <div className={`${baseClasses} h-5 w-20`}></div>
          <div className={`${baseClasses} h-32 w-full`}></div>
        </div>
        <div className={`${baseClasses} h-48 w-full`}></div>
        <div className={`${baseClasses} h-12 w-full`}></div>
      </div>
    ),

    // Interview card skeleton
    interview: (
      <div className="surface-card p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className={`${baseClasses} h-5 w-3/4`}></div>
            <div className="flex items-center space-x-2">
              <div className={`${baseClasses} h-4 w-4`}></div>
              <div className={`${baseClasses} h-4 w-32`}></div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`${baseClasses} h-4 w-4`}></div>
            <div className={`${baseClasses} h-4 w-24`}></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`${baseClasses} h-4 w-4`}></div>
            <div className={`${baseClasses} h-4 w-20`}></div>
          </div>
        </div>
      </div>
    ),

    // List item skeleton
    listItem: (
      <div className="flex items-center space-x-3 p-4 surface-card-soft">
        <div className={`${baseClasses} h-10 w-10 rounded-full`}></div>
        <div className="flex-1 space-y-2">
          <div className={`${baseClasses} h-4 w-3/4`}></div>
          <div className={`${baseClasses} h-3 w-1/2`}></div>
        </div>
        <div className={`${baseClasses} h-6 w-16`}></div>
      </div>
    ),
  };

  // Custom shimmer animation
  const shimmerStyle = {
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };

  // If it's a complex skeleton type, return the JSX directly
  if (skeletonTypes[type] && typeof skeletonTypes[type] !== 'string') {
    return (
      <div className={className}>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className={count > 1 && index < count - 1 ? 'mb-4' : ''}>
            {skeletonTypes[type]}
          </div>
        ))}
      </div>
    );
  }

  // For simple skeleton types, return the div
  const skeletonClass = skeletonTypes[type] || skeletonTypes.line;

  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index} 
          className={`${baseClasses} ${skeletonClass} ${count > 1 && index < count - 1 ? 'mb-3' : ''}`}
          style={shimmerStyle}
        ></div>
      ))}
    </div>
  );
};

// Add the shimmer animation to the global CSS
const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
`;

// Inject the CSS if it doesn't exist
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-css')) {
  const style = document.createElement('style');
  style.id = 'skeleton-shimmer-css';
  style.textContent = shimmerCSS;
  document.head.appendChild(style);
}

export default SkeletonLoader;