import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Clock,
  Download,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { JobStatusBadge } from '../../components/JobStatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { getRecentJobs, cancelJob } from '../../lib/jobs';
import type { GenerationJob } from '../../types';
import { JOB_STATUS_LABELS } from '../../types';
import { cn } from '../../lib/utils';

type JobWithProject = GenerationJob & { projects?: { title: string } };

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

const STATUS_ORDER = [
  'queued',
  'analyzing_audio',
  'segmenting_track',
  'generating_scenes',
  'assembling_edit',
  'rendering_export',
  'completed',
];

function GenerationSteps({ status }: { status: string }) {
  const steps = [
    { key: 'queued', label: 'Queued' },
    { key: 'analyzing_audio', label: 'Audio Analysis' },
    { key: 'segmenting_track', label: 'Track Segmentation' },
    { key: 'generating_scenes', label: 'Scene Generation' },
    { key: 'assembling_edit', label: 'Assembling Edit' },
    { key: 'rendering_export', label: 'Rendering' },
    { key: 'completed', label: 'Complete' },
  ];

  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((step, idx) => {
        const done = idx < currentIdx || status === 'completed';
        const active = STATUS_ORDER[idx] === status && status !== 'completed';

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={cn(
                'w-6 h-6 rounded-full border flex items-center justify-center text-xs',
                done ? 'bg-success/10 border-success/30 text-success' :
                active ? 'bg-primary/10 border-primary/30 text-primary' :
                'bg-secondary/30 border-border/40 text-muted-foreground/40'
              )}>
                {done ? '✓' : active ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <p className={cn(
                'text-[10px] text-center leading-tight max-w-[60px]',
                done ? 'text-success/70' : active ? 'text-primary' : 'text-muted-foreground/40'
              )}>
                {step.label}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                'h-px flex-1 min-w-[16px] mb-4',
                done ? 'bg-success/30' : 'bg-border/30'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function JobCard({
  job,
  onCancel,
  highlighted,
}: {
  job: JobWithProject;
  onCancel: (id: string) => void;
  highlighted: boolean;
}) {
  const navigate = useNavigate();
  const isActive = !TERMINAL_STATUSES.has(job.status);

  return (
    <div className={cn(
      'rounded-xl border bg-card/30 p-5 space-y-4 transition-all',
      highlighted ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border/50',
      isActive ? 'shadow-sm' : ''
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm text-foreground truncate">
              {job.projects?.title ?? 'Untitled Project'}
            </p>
            <Badge variant="outline" className="text-xs font-mono border-border/50">
              v{job.version}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {isActive && <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />}
              <JobStatusBadge status={job.status} />
            </div>
            <span className="text-xs text-muted-foreground/60 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(job.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onCancel(job.id)}
              title="Cancel job"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isActive && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] ?? job.status}</span>
            <span className="font-mono">{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="h-1.5" />
        </div>
      )}

      {/* Step visualization */}
      {isActive && (
        <div className="pt-1">
          <GenerationSteps status={job.status} />
        </div>
      )}

      {/* Error */}
      {job.status === 'failed' && job.error_message && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{job.error_message}</p>
        </div>
      )}

      {/* Completed outputs */}
      {job.status === 'completed' && (
        <div className="flex items-center justify-between rounded-lg border border-success/15 bg-success/5 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-xs font-medium text-success">Generation complete</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => navigate(`/dashboard/projects/${job.project_id}`)}
            >
              <Film className="mr-1.5 h-3 w-3" />
              View
            </Button>
            <Button size="sm" className="h-7 text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15">
              <Download className="mr-1.5 h-3 w-3" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightedJobId = searchParams.get('jobId');

  const [jobs, setJobs] = useState<JobWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const loadJobs = useCallback(async () => {
    if (!user) return;
    const { data } = await getRecentJobs(user.id, 50);
    const incoming = (data ?? []) as JobWithProject[];
    setJobs((prev) => {
      // Skip re-render if nothing changed
      if (prev.length === incoming.length && prev.every((j, i) => j.status === incoming[i].status && j.progress === incoming[i].progress)) {
        return prev;
      }
      return incoming;
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 10000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const handleCancel = async (jobId: string) => {
    if (!user) return;
    await cancelJob(jobId, user.id);
    await loadJobs();
  };

  const filtered = jobs.filter((job) => {
    if (filter === 'active') return !TERMINAL_STATUSES.has(job.status);
    if (filter === 'completed') return job.status === 'completed';
    if (filter === 'failed') return ['failed', 'cancelled'].includes(job.status);
    return true;
  });

  const activeCount = jobs.filter(j => !TERMINAL_STATUSES.has(j.status)).length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Jobs</h1>
            {activeCount > 0 && (
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs">
                {activeCount} active
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Generation pipeline history</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadJobs}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'failed', label: 'Failed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === tab.key
                ? 'bg-secondary border border-border text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-16 text-center">
          <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-1">No jobs</h3>
          <p className="text-sm text-muted-foreground">
            {filter === 'all' ? 'Generation jobs appear here once you start creating.' : `No ${filter} jobs.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onCancel={handleCancel}
              highlighted={job.id === highlightedJobId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
