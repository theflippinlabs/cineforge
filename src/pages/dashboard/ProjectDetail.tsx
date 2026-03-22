import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Film,
  Download,
  Copy,
  Trash2,
  Wand2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Info,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { getProject, duplicateProject, deleteProject } from '../../lib/projects';
import { createGenerationJob } from '../../lib/jobs';
import { VISUAL_STYLE_LABELS, MOOD_LABELS, PACING_LABELS } from '../../lib/presets';
import { JobStatusBadge } from '../../components/JobStatusBadge';
import type { Project, ProjectConfig } from '../../types';
import { JOB_STATUS_LABELS } from '../../types';
import { cn } from '../../lib/utils';

function extractJobConfig(project: Project): ProjectConfig {
  return {
    concept_prompt: project.concept_prompt,
    visual_style: project.visual_style,
    mood: project.mood,
    pacing: project.pacing,
    aspect_ratio: project.aspect_ratio,
    duration_seconds: project.duration_seconds,
    scene_density: project.scene_density,
    realism_level: project.realism_level,
    camera_language: project.camera_language,
    editing_intensity: project.editing_intensity,
    negative_prompt: project.negative_prompt,
    has_brand_overlay: project.has_brand_overlay,
    has_subtitles: project.has_subtitles,
  };
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getProject(id, user.id).then(({ data }) => {
      setProject(data as Project);
      setLoading(false);
    });
  }, [user, id]);

  const handleRegenerate = async () => {
    if (!user || !project) return;
    setRegenerating(true);
    const version = (project.generation_jobs?.length ?? 0) + 1;
    await createGenerationJob(project.id, user.id, extractJobConfig(project), version);
    navigate('/dashboard/jobs');
    setRegenerating(false);
  };

  const handleDuplicate = async () => {
    if (!user || !project) return;
    const { data } = await duplicateProject(project.id, user.id);
    if (data) navigate(`/dashboard/projects/${(data as Project).id}`);
  };

  const handleDelete = async () => {
    if (!user || !project) return;
    await deleteProject(project.id, user.id);
    navigate('/dashboard/projects');
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded-lg bg-secondary/30 animate-pulse" />
        <div className="h-60 rounded-xl bg-secondary/20 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto text-center py-20">
        <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-semibold text-foreground mb-2">Project not found</h2>
        <p className="text-sm text-muted-foreground mb-6">This project doesn't exist or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const jobs = useMemo(
    () => [...(project.generation_jobs ?? [])].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [project.generation_jobs]
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground mt-0.5"
          onClick={() => navigate('/dashboard/projects')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                  {VISUAL_STYLE_LABELS[project.visual_style] || project.visual_style}
                </Badge>
                <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
                  {project.aspect_ratio}
                </Badge>
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
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
              >
                {regenerating ? (
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-3.5 w-3.5" />
                )}
                Regenerate
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="outputs">
        <TabsList className="bg-secondary/30 border border-border/40">
          <TabsTrigger value="outputs" className="data-[state=active]:bg-card text-xs">Outputs</TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-card text-xs">Generation History</TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-card text-xs">Configuration</TabsTrigger>
        </TabsList>

        {/* Outputs tab */}
        <TabsContent value="outputs" className="mt-4">
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-16 text-center">
              <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-medium text-foreground mb-1">No outputs yet</p>
              <p className="text-sm text-muted-foreground mb-5">Click Regenerate to start the generation pipeline.</p>
              <Button size="sm" onClick={handleRegenerate}>
                <Wand2 className="mr-2 h-3.5 w-3.5" />
                Generate Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const outputs = job.generation_outputs || [];
                const finalOutput = outputs.find((o) => o.output_type === 'final');

                return (
                  <div key={job.id} className="rounded-xl border border-border/50 bg-card/30 p-5">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs font-mono border-border/50">
                          v{job.version}
                        </Badge>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>

                    {!['completed', 'failed', 'cancelled'].includes(job.status) && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] || job.status}</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-1.5 animate-progress-pulse" />
                      </div>
                    )}

                    {finalOutput ? (
                      <div className="rounded-lg border border-border/40 bg-secondary/20 overflow-hidden">
                        <div className="aspect-video bg-secondary/30 relative flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-card/80 border border-border flex items-center justify-center">
                            <Play className="w-5 h-5 text-foreground ml-0.5" />
                          </div>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-foreground">{finalOutput.resolution} · {finalOutput.format.toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">{(finalOutput.file_size_bytes / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            <Download className="mr-1.5 h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : job.status === 'completed' ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Output processing...</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Jobs history */}
        <TabsContent value="jobs" className="mt-4">
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No generation history.</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/20 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">v{job.version}</span>
                      <JobStatusBadge status={job.status} />
                    </div>
                    {!['completed', 'failed', 'cancelled'].includes(job.status) && (
                      <Progress value={job.progress} className="h-1 mt-2 max-w-xs" />
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                    {job.error_message && (
                      <p className="text-xs text-destructive mt-0.5 max-w-[160px] truncate">{job.error_message}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Config */}
        <TabsContent value="config" className="mt-4">
          <div className="rounded-xl border border-border/50 bg-card/30 p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Project Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Visual Style', value: VISUAL_STYLE_LABELS[project.visual_style] },
                { label: 'Mood', value: MOOD_LABELS[project.mood] },
                { label: 'Pacing', value: PACING_LABELS[project.pacing] },
                { label: 'Aspect Ratio', value: project.aspect_ratio },
                { label: 'Duration', value: `${project.duration_seconds}s` },
                { label: 'Scene Density', value: project.scene_density },
                { label: 'Realism Level', value: `${project.realism_level}%` },
                { label: 'Camera Language', value: project.camera_language.replace(/_/g, ' ') },
                { label: 'Editing Intensity', value: project.editing_intensity },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-secondary/20 border border-border/30 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-foreground capitalize">{value}</p>
                </div>
              ))}
            </div>

            {project.concept_prompt && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Creative Direction</p>
                <div className="rounded-lg bg-secondary/20 border border-border/30 p-3">
                  <p className="text-sm text-foreground leading-relaxed">{project.concept_prompt}</p>
                </div>
              </div>
            )}

            {project.negative_prompt && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Negative Prompt</p>
                <div className="rounded-lg bg-secondary/20 border border-border/30 p-3">
                  <p className="text-sm text-foreground/70 leading-relaxed">{project.negative_prompt}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
