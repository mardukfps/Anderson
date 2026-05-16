import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'accent';
}

export default function Logo({ className, size = 48, showText = false, variant = 'accent' }: LogoProps) {
  const colorMap = {
    light: 'text-white',
    dark: 'text-app-text',
    accent: 'text-app-accent',
  };

  const textColor = colorMap[variant];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Main Circle - Clock Face */}
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            stroke="currentColor" 
            strokeWidth="6" 
            className={cn("opacity-20", textColor)}
          />

          {/* Hour markers - Minimalist style */}
          <line x1="50" y1="18" x2="50" y2="12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={cn("opacity-30", textColor)} />
          <line x1="82" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={cn("opacity-30", textColor)} />
          <line x1="50" y1="82" x2="50" y2="88" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={cn("opacity-30", textColor)} />
          <line x1="18" y1="50" x2="12" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={cn("opacity-30", textColor)} />

          {/* Checkmark Clock Hands - Representing "Certa" (Right/Correct) */}
          <g transform="translate(50, 50)">
            {/* The "Check" - short hand pointing down-left, long hand pointing up-right */}
            <path
              d="M-15 0 L0 15 L30 -25"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={textColor}
            />
          </g>
          
          {/* Center reflection/point */}
          <circle cx="50" cy="50" r="3" fill="currentColor" className={textColor} />
        </svg>
      </div>
      
      {showText && (
        <div className="flex items-center">
          <h1 className={cn("text-2xl font-black tracking-tight uppercase", textColor)}>
            HORAS <span className={cn(variant === 'light' ? 'text-white' : 'text-app-accent')}>CERTA</span>
          </h1>
        </div>
      )}
    </div>
  );
}
