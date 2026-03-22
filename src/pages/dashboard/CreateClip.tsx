import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Music,
  Upload,
  Link2,
  Wand2,
  ChevronDown,
  Info,
  Loader2,
  Film,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { useAuth } from '../../contexts/AuthContext';
import { createProject, uploadAudio } from '../../lib/projects';
import { createGenerationJob } from '../../lib/jobs';
import { PROMPT_PRESETS, VISUAL_STYLE_LABELS, MOOD_LABELS, PACING_LABELS, CAMERA_LABELS, EDITING_LABELS } from '../../lib/presets';
import type {
  CreateClipFormState,
  VisualStyle,
  Mood,
  Pacing,
  AspectRatio,
  SceneDensity,
  CameraLanguage,
  EditingIntensity,
} from '../../types';
import { cn } from '../../lib/utils';

// ─── Option Chips ─────────────────────────────────────────────────────────────

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3;
}) {
  const colClass = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className={cn('grid gap-2', colClass)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg border px-3 py-2 text-xs font-medium text-left transition-all duration-150',
            value === opt.value
              ? 'border-primary/40 bg-primary/8 text-primary'
              : 'border-border/50 bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground'
          )}
        >
          {opt.value === value && <Check className="inline-block w-3 h-3 mr-1.5 text-primary" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const DEFAULT_FORM: CreateClipFormState = {
  title: '',
  audioFile: null,
  audioUrl: '',
  lyrics: '',
  conceptPrompt: '',
  visualStyle: 'cinematic',
  mood: 'epic',
  pacing: 'dynamic',
  aspectRatio: '16:9',
  durationSeconds: 60,
  sceneDensity: 'balanced',
  realismLevel: 70,
  cameraLanguage: 'wide_epic',
  editingIntensity: 'standard',
  negativePrompt: '',
  hasBrandOverlay: false,
  hasSubtitles: false,
};

export default function CreateClip() {
  const navigate = useNavigate();
  const { user, accessStatus } = useAuth();
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateClipFormState>(DEFAULT_FORM);
  const [audioTab, setAudioTab] = useState<'upload' | 'url'>('upload');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof CreateClipFormState>(key: K, value: CreateClipFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetId: string) => {
    const preset = PROMPT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      conceptPrompt: preset.concept_prompt,
      visualStyle: preset.visual_style,
      mood: preset.mood,
      pacing: preset.pacing,
      cameraLanguage: preset.camera_language,
      editingIntensity: preset.editing_intensity,
      realismLevel: preset.realism_level,
    }));
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!form.title.trim()) { setError('Please enter a project title.'); return; }
    if (!form.conceptPrompt.trim()) { setError('Please enter a creative direction prompt.'); return; }
    if (!form.audioFile && !form.audioUrl.trim()) { setError('Please upload an audio file or provide a URL.'); return; }

    setError(null);
    setGenerating(true);

    try {
      let audioUrl = form.audioUrl;

      if (form.audioFile) {
        const { url, error: uploadError } = await uploadAudio(form.audioFile, user.id);
        if (uploadError || !url) throw new Error('Audio upload failed. Please try again.');
        audioUrl = url;
      }

      const { data: project, error: projectError } = await createProject(user.id, {
        ...form,
        audioUrl,
      });

      if (projectError || !project) throw new Error(projectError?.message || 'Failed to create project.');

      const { data: job, error: jobError } = await createGenerationJob(
        project.id,
        user.id,
        {
          concept_prompt: form.conceptPrompt,
          visual_style: form.visualStyle,
          mood: form.mood,
          pacing: form.pacing,
          aspect_ratio: form.aspectRatio,
          duration_seconds: form.durationSeconds,
          scene_density: form.sceneDensity,
          realism_level: form.realismLevel,
          camera_language: form.cameraLanguage,
          editing_intensity: form.editingIntensity,
          negative_prompt: form.negativePrompt || null,
          has_brand_overlay: form.hasBrandOverlay,
          has_subtitles: form.hasSubtitles,
        }
      );

      if (jobError || !job) throw new Error(jobError?.message || 'Failed to start generation.');

      navigate(`/dashboard/jobs?jobId=${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = accessStatus?.nftVerified || (accessStatus?.generationsRemaining ?? 0) > 0;

  return (
    <TooltipProvider>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Create Clip</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your cinematic parameters and generate.
            </p>
          </div>
          {accessStatus && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                accessStatus.nftVerified
                  ? 'border-primary/30 text-primary bg-primary/5'
                  : 'border-border text-muted-foreground'
              )}
            >
              {accessStatus.nftVerified ? '∞ Generations' : `${accessStatus.generationsRemaining} left`}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column: Audio + Prompt */}
          <div className="xl:col-span-2 space-y-5">
            {/* Project title */}
            <FormSection title="Project Title">
              <Input
                placeholder="e.g. Summer EP — Visual Campaign"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="bg-secondary/20 border-border/60 focus:border-primary/50"
              />
            </FormSection>

            {/* Audio */}
            <FormSection title="Audio Track" description="Upload a file or link an external track.">
              <Tabs value={audioTab} onValueChange={(v) => setAudioTab(v as 'upload' | 'url')}>
                <TabsList className="bg-secondary/30 border border-border/40 h-8">
                  <TabsTrigger value="upload" className="text-xs h-6 data-[state=active]:bg-card">
                    <Upload className="w-3 h-3 mr-1.5" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs h-6 data-[state=active]:bg-card">
                    <Link2 className="w-3 h-3 mr-1.5" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-3">
                  <input
                    type="file"
                    ref={audioInputRef}
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => update('audioFile', e.target.files?.[0] || null)}
                  />
                  {form.audioFile ? (
                    <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
                      <Music className="w-4 h-4 text-success flex-shrink-0" />
                      <p className="text-sm text-foreground flex-1 truncate">{form.audioFile.name}</p>
                      <button
                        type="button"
                        onClick={() => update('audioFile', null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full rounded-lg border-2 border-dashed border-border/40 bg-secondary/10 p-8 text-center hover:border-border/60 hover:bg-secondary/20 transition-all"
                    >
                      <Upload className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Drop audio file or click to browse</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">MP3, WAV, FLAC, AAC — up to 200MB</p>
                    </button>
                  )}
                </TabsContent>

                <TabsContent value="url" className="mt-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://soundcloud.com/... or direct audio URL"
                      value={form.audioUrl}
                      onChange={(e) => update('audioUrl', e.target.value)}
                      className="bg-secondary/20 border-border/60 focus:border-primary/50"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </FormSection>

            {/* Lyrics */}
            <FormSection title="Lyrics (Optional)" description="Helps with timing and lyric-sync if subtitles are enabled.">
              <Textarea
                placeholder="Paste lyrics here..."
                value={form.lyrics}
                onChange={(e) => update('lyrics', e.target.value)}
                rows={4}
                className="bg-secondary/20 border-border/60 focus:border-primary/50 resize-none text-sm"
              />
            </FormSection>

            {/* Creative direction */}
            <FormSection title="Creative Direction" description="Describe the visual world, atmosphere, and narrative intent.">
              {/* Presets */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Quick presets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className="px-2.5 py-1 rounded-md border border-border/50 bg-secondary/20 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Rain-soaked streets, neon reflections, a lone figure walking through fog, emotional depth, cinematic close-ups, shadow and light interplay..."
                value={form.conceptPrompt}
                onChange={(e) => update('conceptPrompt', e.target.value)}
                rows={5}
                className="bg-secondary/20 border-border/60 focus:border-primary/50 resize-none text-sm"
              />
            </FormSection>

            {/* Negative prompt */}
            <FormSection title="Negative Prompt" description="Elements to avoid in the generated visuals.">
              <Input
                placeholder="blur, text overlay, watermark, low quality, cartoon..."
                value={form.negativePrompt}
                onChange={(e) => update('negativePrompt', e.target.value)}
                className="bg-secondary/20 border-border/60 focus:border-primary/50"
              />
            </FormSection>
          </div>

          {/* Right column: Creative parameters */}
          <div className="space-y-5">
            {/* Visual Style */}
            <FormSection title="Visual Style">
              <OptionGrid<VisualStyle>
                columns={2}
                value={form.visualStyle}
                onChange={(v) => update('visualStyle', v)}
                options={Object.entries(VISUAL_STYLE_LABELS).map(([value, label]) => ({ value: value as VisualStyle, label }))}
              />
            </FormSection>

            {/* Mood */}
            <FormSection title="Mood">
              <OptionGrid<Mood>
                columns={2}
                value={form.mood}
                onChange={(v) => update('mood', v)}
                options={Object.entries(MOOD_LABELS).map(([value, label]) => ({ value: value as Mood, label }))}
              />
            </FormSection>

            {/* Pacing */}
            <FormSection title="Pacing">
              <OptionGrid<Pacing>
                columns={1}
                value={form.pacing}
                onChange={(v) => update('pacing', v)}
                options={Object.entries(PACING_LABELS).map(([value, label]) => ({ value: value as Pacing, label }))}
              />
            </FormSection>

            {/* Aspect ratio */}
            <FormSection title="Aspect Ratio">
              <OptionGrid<AspectRatio>
                columns={3}
                value={form.aspectRatio}
                onChange={(v) => update('aspectRatio', v)}
                options={[
                  { value: '16:9', label: '16:9' },
                  { value: '9:16', label: '9:16' },
                  { value: '1:1', label: '1:1' },
                  { value: '4:5', label: '4:5' },
                  { value: '21:9', label: '21:9' },
                ]}
              />
            </FormSection>

            {/* Duration */}
            <FormSection title="Duration" description={`${form.durationSeconds}s`}>
              <Slider
                value={[form.durationSeconds]}
                onValueChange={([v]) => update('durationSeconds', v)}
                min={15}
                max={600}
                step={15}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>15s</span>
                <span>10min</span>
              </div>
            </FormSection>

            {/* Scene density */}
            <FormSection title="Scene Density">
              <OptionGrid<SceneDensity>
                columns={3}
                value={form.sceneDensity}
                onChange={(v) => update('sceneDensity', v)}
                options={[
                  { value: 'sparse', label: 'Sparse' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'dense', label: 'Dense' },
                ]}
              />
            </FormSection>

            {/* Realism slider */}
            <FormSection title="Realism vs Stylization" description={form.realismLevel <= 30 ? 'Highly stylized' : form.realismLevel >= 75 ? 'Photo-realistic' : 'Balanced'}>
              <Slider
                value={[form.realismLevel]}
                onValueChange={([v]) => update('realismLevel', v)}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Stylized</span>
                <span>Realistic</span>
              </div>
            </FormSection>

            {/* Camera language */}
            <FormSection title="Camera Language">
              <OptionGrid<CameraLanguage>
                columns={2}
                value={form.cameraLanguage}
                onChange={(v) => update('cameraLanguage', v)}
                options={Object.entries(CAMERA_LABELS).map(([value, label]) => ({ value: value as CameraLanguage, label }))}
              />
            </FormSection>

            {/* Editing intensity */}
            <FormSection title="Editing Intensity">
              <OptionGrid<EditingIntensity>
                columns={2}
                value={form.editingIntensity}
                onChange={(v) => update('editingIntensity', v)}
                options={Object.entries(EDITING_LABELS).map(([value, label]) => ({ value: value as EditingIntensity, label }))}
              />
            </FormSection>

            {/* Toggles */}
            <FormSection title="Output Options">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-foreground">Brand Overlay</Label>
                    <p className="text-xs text-muted-foreground">Add logo / watermark to output</p>
                  </div>
                  <Switch
                    checked={form.hasBrandOverlay}
                    onCheckedChange={(v) => update('hasBrandOverlay', v)}
                    disabled={!accessStatus?.nftVerified}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-foreground">Subtitles</Label>
                    <p className="text-xs text-muted-foreground">Auto-generate from lyrics</p>
                  </div>
                  <Switch
                    checked={form.hasSubtitles}
                    onCheckedChange={(v) => update('hasSubtitles', v)}
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-2">
            <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/40 bg-card/30 p-5">
          <div>
            <p className="font-semibold text-foreground">Ready to generate?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {canGenerate
                ? 'Your parameters are locked in. Click to begin the pipeline.'
                : 'You\'ve reached your free tier limit. Connect wallet or upgrade to continue.'}
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            size="lg"
            className={cn(
              'px-8 font-medium',
              canGenerate
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting generation...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Clip
              </div>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
