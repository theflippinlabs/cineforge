import { CheckCircle2, CircleDot, Circle, XCircle, Loader2, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';
import type { GenerationStep, GenerationStepName } from '../types';
import { GENERATION_STEP_LABELS, GENERATION_STEP_ORDER } from '../types';

interface Props {
  steps: GenerationStep[];
  currentStep: GenerationStepName | null;
  compact?: boolean;
}

function StepIcon({ status, isCurrent }: { status: GenerationStep['status']; isCurrent: boolean }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-destructive" />;
  if (status === 'skipped') return <SkipForward className="w-4 h-4 text-muted-foreground/40" />;
  if (status === 'running' || isCurrent) return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  return <Circle className="w-4 h-4 text-border" />;
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '';
  const endTime = end ? new Date(end).getTime() : Date.now();
  const ms = endTime - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function JobStatusTimeline({ steps, currentStep, compact = false }: Props) {
  // Build a map from step_name to step data
  const stepMap = new Map(steps.map((s) => [s.step_name, s]));

  return (
    <div className="space-y-0">
      {GENERATION_STEP_ORDER.map((name, index) => {
        const step = stepMap.get(name);
        const status = step?.status ?? 'pending';
        const isCurrent = name === currentStep;
        const isLast = index === GENERATION_STEP_ORDER.length - 1;
        const label = GENERATION_STEP_LABELS[name];
        const duration = formatDuration(step?.started_at ?? null, step?.completed_at ?? null);

        return (
          <div key={name} className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                status === 'completed' && 'bg-success/10 border border-success/20',
                status === 'running' && 'bg-primary/10 border border-primary/25',
                status === 'failed' && 'bg-destructive/10 border border-destructive/20',
                status === 'pending' && 'bg-secondary border border-border/40',
                status === 'skipped' && 'bg-secondary/50 border border-border/20',
              )}>
                <StepIcon status={status} isCurrent={isCurrent} />
              </div>
              {!isLast && (
                <div className={cn(
                  'w-px flex-1 min-h-[1.25rem] mt-1',
                  status === 'completed' ? 'bg-success/30' : 'bg-border/30'
                )} />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-center justify-between gap-2 pt-1.5">
                <span className={cn(
                  'text-sm font-medium',
                  status === 'completed' ? 'text-foreground' : '',
                  status === 'running' ? 'text-primary' : '',
                  status === 'failed' ? 'text-destructive' : '',
                  status === 'pending' ? 'text-muted-foreground/50' : '',
                  status === 'skipped' ? 'text-muted-foreground/30' : '',
                )}>
                  {label}
                </span>
                {duration && (
                  <span className="text-xs text-muted-foreground/50 tabular-nums flex-shrink-0">
                    {duration}
                  </span>
                )}
              </div>

              {status === 'running' && step?.progress !== undefined && step.progress > 0 && (
                <div className="mt-1.5 h-0.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              )}

              {status === 'failed' && step?.error_message && !compact && (
                <p className="text-xs text-destructive/70 mt-1">{step.error_message}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
