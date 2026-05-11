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
          {/* Circular background shadow/depth */}
          <circle 
            cx="50" 
            cy="52" 
            r="44" 
            className="fill-black/5 dark:fill-white/5"
          />

          {/* Outer Ring - Journey and Clock concept */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray="220 50"
            className={cn("opacity-20", textColor)}
          />
          
          {/* Active Arc - Progress */}
          <path
            d="M15 75 A44 44 0 0 1 50 6"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className={textColor}
          />

          {/* Growth Bars - Financial Conversion */}
          <rect x="30" y="55" width="8" height="15" rx="2" className={cn("fill-current opacity-40", textColor)} />
          <rect x="46" y="45" width="8" height="25" rx="2" className={cn("fill-current opacity-70", textColor)} />
          <rect x="62" y="32" width="8" height="38" rx="2" className={cn("fill-current", textColor)} />

          {/* The Plus Branding */}
          <path 
            d="M80 10V30M70 20H90" 
            stroke="currentColor" 
            strokeWidth="12" 
            strokeLinecap="round" 
            className={cn(variant === 'light' ? 'text-white' : 'text-app-accent')} 
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex items-center">
          <h1 className={cn("text-2xl font-black tracking-widest uppercase", textColor)}>
            JORNADA<span className={cn(variant === 'light' ? 'text-white' : 'text-app-accent')}>+</span>
          </h1>
        </div>
      )}
    </div>
  );
}
