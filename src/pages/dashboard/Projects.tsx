import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Film,
  MoreHorizontal,
  Copy,
  Trash2,
  ArrowRight,
  Clock,
  Wand2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { getProjects, duplicateProject, deleteProject } from '../../lib/projects';
import { VISUAL_STYLE_LABELS } from '../../lib/presets';
import type { Project } from '../../types';
import { cn } from '../../lib/utils';

function ProjectStatusBadge({ status }: { status: Project['status'] }) {
  const config: Record<Project['status'], { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'border-border text-muted-foreground' },
    generating: { label: 'Generating', className: 'border-primary/30 text-primary bg-primary/5 animate-pulse' },
    completed: { label: 'Completed', className: 'border-success/30 text-success bg-success/5' },
    archived: { label: 'Archived', className: 'border-border text-muted-foreground/50' },
  };

  const c = config[status];
  return (
    <Badge variant="outline" className={cn('text-xs', c.className)}>
      {c.label}
    </Badge>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    getProjects(user.id).then(({ data }) => {
      setProjects(data ?? []);
      setLoading(false);
    });
  }, [user?.id]);

  const filtered = useMemo(
    () => projects.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [projects, search]
  );

  const handleDuplicate = async (projectId: string) => {
    if (!user) return;
    const { data } = await duplicateProject(projectId, user.id);
    if (data) {
      setProjects((prev) => [data as Project, ...prev]);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!user) return;
    await deleteProject(projectId, user.id);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => navigate('/dashboard/create')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/20 border-border/60 focus:border-primary/50"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-secondary/10 p-16 text-center">
          <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-1">
            {search ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            {search ? 'Try a different search term.' : 'Create your first cinematic clip.'}
          </p>
          {!search && (
            <Button onClick={() => navigate('/dashboard/create')} size="sm">
              <Wand2 className="mr-2 h-3.5 w-3.5" />
              Create First Clip
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="group rounded-xl border border-border/50 bg-card/30 overflow-hidden hover:border-border/70 hover:bg-card/50 transition-all cursor-pointer"
              onClick={() => navigate(`/dashboard/projects/${project.id}`)}
            >
              {/* Thumbnail area */}
              <div className="aspect-video bg-gradient-to-br from-secondary/40 to-background relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground/20" />
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur rounded-lg px-3 py-1.5 border border-border/50">
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-foreground font-medium">Open</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm text-foreground leading-tight line-clamp-2">{project.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/projects/${project.id}`)}>
                        <Film className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(project.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(project.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground/70">
                    {VISUAL_STYLE_LABELS[project.visual_style] ?? project.visual_style}
                  </Badge>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="flex items-center gap-1.5 mt-3">
                  <Clock className="w-3 h-3 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
