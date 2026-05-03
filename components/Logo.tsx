import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10 w-auto" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 400 200" 
      className={className}
      fill="currentColor"
      aria-label="Trustyyellowcabs Logo"
    >
      <g>
        {/* Car Body Silhouette */}
        <path d="M 35 135 C 35 110 50 90 70 85 C 80 82 100 60 130 45 C 160 30 250 25 300 40 C 330 50 360 70 365 100 C 370 120 370 135 365 145 C 360 155 350 160 340 160 L 305 160 A 28 28 0 0 1 249 160 L 146 160 A 28 28 0 0 1 90 160 L 50 160 C 40 160 35 150 35 135 Z" />
        
        {/* Wheels */}
        <circle cx="118" cy="160" r="24" />
        <circle cx="277" cy="160" r="24" />
      </g>
    </svg>
  );
};