import { cn } from '../lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn('w-7 h-7 flex items-center justify-center flex-shrink-0', className)}>
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="synema-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220 15% 90%)" />
            <stop offset="45%" stopColor="hsl(204 100% 70%)" />
            <stop offset="100%" stopColor="hsl(220 15% 55%)" />
          </linearGradient>
          <filter id="synema-glow">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer ring */}
        <circle cx="14" cy="14" r="12.5" stroke="url(#synema-chrome)" strokeWidth="0.8" strokeOpacity="0.4" />
        {/* Stylised S — upper arc */}
        <path
          d="M18.5 9C17.2 7.5 15.4 7 13.5 7C10.5 7 8.5 8.8 8.5 11C8.5 13.5 10.5 14.5 13.5 15C16.5 15.5 19 16.5 19 19C19 21.2 17 23 14 23C11.8 23 9.8 22.2 8.5 20.5"
          stroke="url(#synema-chrome)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#synema-glow)"
        />
        {/* Film perforations — top */}
        <rect x="11.5" y="6" width="1.2" height="1.8" rx="0.3" fill="hsl(204 100% 70%)" opacity="0.7" />
        <rect x="14.5" y="6" width="1.2" height="1.8" rx="0.3" fill="hsl(204 100% 70%)" opacity="0.5" />
        {/* Film perforations — bottom */}
        <rect x="11.5" y="21.2" width="1.2" height="1.8" rx="0.3" fill="hsl(204 100% 70%)" opacity="0.7" />
        <rect x="14.5" y="21.2" width="1.2" height="1.8" rx="0.3" fill="hsl(204 100% 70%)" opacity="0.5" />
        {/* Center glow dot */}
        <circle cx="14" cy="14.5" r="1" fill="hsl(204 100% 70%)" opacity="0.9" filter="url(#synema-glow)" />
      </svg>
    </div>
  );
}

/** Full wordmark — logo + "Synema" text */
export function SynemaWordmark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="font-display font-semibold text-foreground tracking-tight">Synema</span>
    </div>
  );
}
