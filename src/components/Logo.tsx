import React from 'react';

export default function Logo({ className = "w-8 h-8", withText = true, primaryColor = "#1A365D", logoUrl }: { className?: string, withText?: boolean, primaryColor?: string, logoUrl?: string }) {
  if (logoUrl) {
    return (
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="Logo" className={`${className} object-contain rounded`} />
        {withText && (
          <span className="text-xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
            University<span className="text-[#10b981]">Solution</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <svg 
        viewBox="0 0 200 200" 
        className={`${className} drop-shadow-md`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE08B" />
            <stop offset="25%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#AA7C11" />
            <stop offset="75%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#FDE08B" />
          </linearGradient>
          <path id="text-path-top" d="M 25, 100 A 75, 75 0 0,1 175, 100" />
          <path id="text-path-bottom" d="M 25, 100 A 75, 75 0 0,0 175, 100" />
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer gold ring */}
        <circle cx="100" cy="100" r="96" fill="url(#gold-grad)" filter="url(#drop-shadow)" />
        {/* Navy background */}
        <circle cx="100" cy="100" r="88" fill={primaryColor} />
        {/* Inner gold ring */}
        <circle cx="100" cy="100" r="62" fill="none" stroke="url(#gold-grad)" strokeWidth="1.5" />

        {/* Circular Text */}
        <text fontFamily="Georgia, serif" fontSize="15" fill="url(#gold-grad)" fontWeight="bold" letterSpacing="2.5">
          <textPath href="#text-path-top" startOffset="50%" textAnchor="middle" dominantBaseline="middle">UNIVERSITY SOLUTIONS</textPath>
        </text>
        <text fontFamily="Georgia, serif" fontSize="15" fill="url(#gold-grad)" fontWeight="bold" letterSpacing="2.5">
          <textPath href="#text-path-bottom" startOffset="50%" textAnchor="middle" dominantBaseline="middle">UNIVERSITY SOLUTIONS</textPath>
        </text>

        {/* Dots */}
        <circle cx="25" cy="100" r="2.5" fill="url(#gold-grad)" />
        <circle cx="175" cy="100" r="2.5" fill="url(#gold-grad)" />

        {/* Center U */}
        <text x="82" y="132" fontFamily="Georgia, serif" fontSize="75" fill="#FFFFFF" textAnchor="middle">U</text>
        
        {/* Star */}
        <g transform="translate(86, 95) scale(0.12)">
          <polygon points="100,10 40,198 190,78 10,78 160,198" fill="url(#gold-grad)" />
        </g>

        {/* Center S */}
        <text x="122" y="132" fontFamily="Georgia, serif" fontSize="75" fill="url(#gold-grad)" textAnchor="middle" filter="url(#drop-shadow)">S</text>

        {/* Graduation Cap */}
        <g transform="translate(108, 62) scale(0.65)">
          <path d="M 0,15 L 25,5 L 50,15 L 25,25 Z" fill="url(#gold-grad)" />
          <path d="M 10,20 L 10,35 A 15,8 0 0,0 40,35 L 40,20" fill="none" stroke="url(#gold-grad)" strokeWidth="6" />
          <line x1="0" y1="15" x2="-5" y2="40" stroke="url(#gold-grad)" strokeWidth="3" />
          <circle cx="-5" cy="43" r="4" fill="url(#gold-grad)" />
        </g>
      </svg>
      {withText && (
        <span className="text-xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
          University<span className="text-[#10b981]">Solution</span>
        </span>
      )}
    </div>
  );
}
