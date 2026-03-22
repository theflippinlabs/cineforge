import React from 'react';
import { Badge } from './ui/badge';
import { JOB_STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';

const JOB_STATUS_VARIANTS: Record<string, string> = {
  queued: 'border-border text-muted-foreground',
  analyzing_audio: 'border-primary/30 text-primary bg-primary/5',
  segmenting_track: 'border-primary/30 text-primary bg-primary/5',
  generating_scenes: 'border-warning/30 text-warning bg-warning/5',
  assembling_edit: 'border-warning/30 text-warning bg-warning/5',
  rendering_export: 'border-primary/30 text-primary bg-primary/5 animate-pulse',
  completed: 'border-success/30 text-success bg-success/5',
  failed: 'border-destructive/30 text-destructive bg-destructive/5',
  cancelled: 'border-border text-muted-foreground',
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs', JOB_STATUS_VARIANTS[status] ?? 'border-border text-muted-foreground')}
    >
      {JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS] ?? status}
    </Badge>
  );
}
