import React from 'react';

export default function Logo({ className = "w-8 h-8", withText = true }: { className?: string, withText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="32" height="32" rx="8" fill="url(#paint0_linear)" />
        <path d="M16 8L8 12L16 16L24 12L16 8Z" fill="white" fillOpacity="0.9" />
        <path d="M8 16V20L16 24L24 20V16L16 20L8 16Z" fill="white" fillOpacity="0.7" />
        <path d="M16 24V28L24 24V20L16 24Z" fill="white" fillOpacity="0.5" />
        <defs>
          <linearGradient id="paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" /> {/* blue-600 */}
            <stop offset="1" stopColor="#059669" /> {/* emerald-600 */}
          </linearGradient>
        </defs>
      </svg>
      {withText && (
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          University<span className="text-blue-600">Solution</span>
        </span>
      )}
    </div>
  );
}
