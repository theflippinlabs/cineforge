import { cn } from '../lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn('w-7 h-7 flex items-center justify-center flex-shrink-0', className)}>
      <img src="/logo.png" alt="Synema" className="w-full h-full object-contain" />
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
