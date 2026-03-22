import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wand2,
  FolderOpen,
  Activity,
  Download,
  Wallet,
  ArrowRight,
  TrendingUp,
  Clock,
  Film,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { JobStatusBadge } from '../../components/JobStatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { getProjects } from '../../lib/projects';
import { getRecentJobs } from '../../lib/jobs';
import type { Project, GenerationJob } from '../../types';
import { cn } from '../../lib/utils';

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(
      'border transition-colors',
      highlight ? 'border-primary/20 bg-primary/3' : 'border-border/50 bg-card/40'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            highlight ? 'bg-primary/10 border border-primary/20' : 'bg-secondary border border-border/50'
          )}>
            <Icon className={cn('w-4 h-4', highlight ? 'text-primary' : 'text-muted-foreground')} />
          </div>
        </div>
        <p className="text-2xl font-bold font-display text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}


export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user, profile, accessStatus } = useAuth();
  type JobWithProject = GenerationJob & { projects?: { title: string } };
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getProjects(user.id).then(({ data }) => setProjects(data || [])),
      getRecentJobs(user.id, 5).then(({ data }) => setRecentJobs((data ?? []) as JobWithProject[])),
    ]).finally(() => setLoading(false));
  }, [user]);

  const activeJobs = recentJobs.filter((j) =>
    !['completed', 'failed', 'cancelled'].includes(j.status)
  ).length;

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Creator';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Good to see you, {displayName}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your creative studio is ready.
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/create')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground hidden sm:flex"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          New Clip
        </Button>
      </div>

      {/* Access status */}
      {accessStatus && !accessStatus.nftVerified && (
        <div
          className="rounded-xl border border-border/40 bg-card/30 p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-border/60 transition-colors"
          onClick={() => navigate('/dashboard/wallet')}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
              <Wallet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Unlock Premium Access</p>
              <p className="text-xs text-muted-foreground">Connect a wallet with an eligible NFT to unlock unlimited generations.</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={projects.length}
          icon={FolderOpen}
          sub={`${projects.filter(p => p.status === 'completed').length} completed`}
        />
        <StatCard
          label="Active Jobs"
          value={activeJobs}
          icon={Activity}
          highlight={activeJobs > 0}
          sub={activeJobs > 0 ? 'In progress' : 'No active jobs'}
        />
        <StatCard
          label="Generations"
          value={recentJobs.length}
          icon={TrendingUp}
          sub="Last 30 days"
        />
        <StatCard
          label="Generations Left"
          value={accessStatus?.generationsRemaining === 999 ? '∞' : (accessStatus?.generationsRemaining ?? 0)}
          icon={Sparkles}
          highlight={accessStatus?.nftVerified}
          sub={accessStatus?.nftVerified ? 'NFT Premium' : `of ${accessStatus?.generationsTotal ?? 5} this month`}
        />
      </div>

      {/* Usage bar (free tier only) */}
      {accessStatus && !accessStatus.nftVerified && accessStatus.generationsTotal > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Monthly Generations</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accessStatus.generationsTotal - accessStatus.generationsRemaining} of {accessStatus.generationsTotal} used
              </p>
            </div>
            <Badge variant="outline" className="text-xs">Free Tier</Badge>
          </div>
          <Progress
            value={((accessStatus.generationsTotal - accessStatus.generationsRemaining) / accessStatus.generationsTotal) * 100}
            className="h-1.5"
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent projects */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Projects</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/dashboard/projects')}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-10 text-center">
              <Film className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No projects yet</p>
              <p className="text-xs text-muted-foreground/60 mb-4">Create your first cinematic clip.</p>
              <Button size="sm" onClick={() => navigate('/dashboard/create')}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Create Clip
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3.5 cursor-pointer hover:border-border/60 hover:bg-card/50 transition-all group"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center flex-shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{project.visual_style.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        project.status === 'completed' ? 'border-success/30 text-success' :
                        project.status === 'generating' ? 'border-primary/30 text-primary animate-pulse' :
                        'border-border text-muted-foreground'
                      )}
                    >
                      {project.status}
                    </Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent jobs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Generation Jobs</h2>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/dashboard/jobs')}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-secondary/20 animate-pulse" />
              ))}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-8 text-center">
              <Activity className="w-7 h-7 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No jobs yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Jobs appear here once you generate a clip.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-border/40 bg-card/30 p-3.5 cursor-pointer hover:bg-card/50 transition-colors"
                  onClick={() => navigate('/dashboard/jobs')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-foreground truncate max-w-[120px]">
                      {(job as any).projects?.title || 'Untitled'}
                    </p>
                    <JobStatusBadge status={job.status} />
                  </div>
                  {!['completed', 'failed', 'cancelled'].includes(job.status) && (
                    <Progress value={job.progress} className="h-1" />
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground/60 font-mono">
                      v{job.version} · {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick CTA */}
      <div className="rounded-xl border border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Ready to create?</h3>
          <p className="text-sm text-muted-foreground">
            Set your creative direction and generate a cinematic clip in minutes.
          </p>
        </div>
        <Button
          onClick={() => navigate('/dashboard/create')}
          className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          New Clip
        </Button>
      </div>
    </div>
  );
}
