import React from 'react';
import { Film } from 'lucide-react';

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`w-7 h-7 rounded bg-primary/15 border border-primary/25 flex items-center justify-center ${className ?? ''}`}>
      <Film className="w-4 h-4 text-primary" />
    </div>
  );
}
