import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Link2, Wand2, ChevronRight, AlertCircle,
  Lock, ChevronDown, ImagePlus, X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { createProject, uploadAudio, uploadCharacterImage } from '../../lib/projects';
import { createGenerationJob, createGenerationSteps } from '../../lib/jobs';
import { runPipeline } from '../../lib/pipeline';
import { PROMPT_PRESETS, VISUAL_STYLE_LABELS, MOOD_LABELS, PACING_LABELS } from '../../lib/presets';
import { CINEMATIC_MODES, SHOT_LANGUAGES } from '../../lib/quality';
import type {
  VisualStyle, Mood, Pacing, AspectRatio, SceneDensity,
  CameraLanguage, EditingIntensity, CinematicMode, ShotLanguage,
} from '../../types';
import { cn } from '../../lib/utils';

// ─── Option Grid ──────────────────────────────────────────────────────────────

function OptionGrid<T extends string>({
  options, value, onChange, columns = 3,
}: {
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3 | 4;
}) {
  const gridClass = columns === 1 ? 'grid-cols-1'
    : columns === 2 ? 'grid-cols-2'
    : columns === 4 ? 'grid-cols-4'
    : 'grid-cols-3';
  return (
    <div className={`grid ${gridClass} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg border px-3 py-2.5 text-left transition-all',
            value === opt.value
              ? 'border-primary/50 bg-primary/8 text-foreground'
              : 'border-border/40 bg-secondary/20 text-muted-foreground hover:border-border/70 hover:text-foreground'
          )}
        >
          <p className="text-xs font-medium leading-tight">{opt.label}</p>
          {opt.description && (
            <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">{opt.description}</p>
          )}
        </button>
      ))}
    </div>
  );
}

function Section({
  title, children, badge, locked = false, lockedLabel,
}: {
  title: string;
  children: React.ReactNode;
  badge?: string;
  locked?: boolean;
  lockedLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">{title}</h3>
        {badge && <Badge variant="outline" className="text-[10px] border-primary/25 text-primary">{badge}</Badge>}
        {locked && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary border border-border/40 rounded-full px-2 py-0.5">
            <Lock className="w-2.5 h-2.5" />
            {lockedLabel ?? 'Premium'}
          </span>
        )}
      </div>
      <div className={cn(locked && 'opacity-50 pointer-events-none')}>{children}</div>
    </div>
  );
}

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string; description: string }[] = [
  { value: '16:9', label: '16:9', description: 'Landscape' },
  { value: '9:16', label: '9:16', description: 'Vertical' },
  { value: '1:1', label: '1:1', description: 'Square' },
  { value: '4:5', label: '4:5', description: 'Portrait' },
  { value: '21:9', label: '21:9', description: 'Ultrawide' },
];

const SCENE_DENSITY_OPTIONS: { value: SceneDensity; label: string; description: string }[] = [
  { value: 'sparse', label: 'Sparse', description: 'Long takes' },
  { value: 'balanced', label: 'Balanced', description: 'Standard' },
  { value: 'dense', label: 'Dense', description: 'Fast cuts' },
];

const DURATION_OPTIONS = [15, 30, 60, 90, 120, 180];

export default function CreateClip() {
  const navigate = useNavigate();
  const { user, accessStatus } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPremium = accessStatus?.nftVerified
    || ['pro', 'premium', 'enterprise'].includes(accessStatus?.tier ?? '');

  const [title, setTitle] = useState('');
  const [audioTab, setAudioTab] = useState<'upload' | 'url'>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [conceptPrompt, setConceptPrompt] = useState('');

  const [cinematicMode, setCinematicMode] = useState<CinematicMode>('cinematic');
  const selectedMode = CINEMATIC_MODES.find((m) => m.id === cinematicMode)!;

  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic');
  const [mood, setMood] = useState<Mood>('epic');
  const [pacing, setPacing] = useState<Pacing>('moderate');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [sceneDensity, setSceneDensity] = useState<SceneDensity>('balanced');
  const [realismLevel, setRealismLevel] = useState(80);
  const [cameraLanguage] = useState<CameraLanguage>('static_composed');
  const [shotLanguage, setShotLanguage] = useState<ShotLanguage>(selectedMode.defaults.shot_language);
  const [editingIntensity, setEditingIntensity] = useState<EditingIntensity>(selectedMode.defaults.editing_intensity);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [hasBrandOverlay, setHasBrandOverlay] = useState(false);
  const [hasSubtitles, setHasSubtitles] = useState(false);
  const [hasStyleLock, setHasStyleLock] = useState(true);
  const [enableGuardrails, setEnableGuardrails] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [characterFiles, setCharacterFiles] = useState<File[]>([]);
  const [characterPreviews, setCharacterPreviews] = useState<string[]>([]);
  const characterInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCharacterFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = '';
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const valid = incoming.filter(
      (f) => validTypes.includes(f.type) && f.size <= 5 * 1024 * 1024
    );
    setCharacterFiles((prev) => {
      const next = [...prev, ...valid].slice(0, 4);
      // Build object URL previews for the new files
      const newPreviews = valid.slice(0, 4 - prev.length).map((f) => URL.createObjectURL(f));
      setCharacterPreviews((p) => [...p, ...newPreviews].slice(0, 4));
      return next;
    });
  };

  const removeCharacter = (index: number) => {
    URL.revokeObjectURL(characterPreviews[index]);
    setCharacterFiles((prev) => prev.filter((_, i) => i !== index));
    setCharacterPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const applyMode = (mode: CinematicMode) => {
    const config = CINEMATIC_MODES.find((m) => m.id === mode);
    if (!config) return;
    setCinematicMode(mode);
    setShotLanguage(config.defaults.shot_language);
    setEditingIntensity(config.defaults.editing_intensity);
    setRealismLevel(config.defaults.realism_level);
    setHasStyleLock(config.defaults.guardrails.style_lock);
  };

  const applyPreset = (preset: (typeof PROMPT_PRESETS)[number]) => {
    setConceptPrompt(preset.concept_prompt);
    setVisualStyle(preset.visual_style);
    setMood(preset.mood);
    setPacing(preset.pacing);
    setShotLanguage(preset.shot_language);
    setEditingIntensity(preset.editing_intensity);
    setRealismLevel(preset.realism_level);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported audio format. Use MP3, WAV, FLAC, AAC, or OGG.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100 MB.');
      return;
    }
    setAudioFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isPremium && accessStatus && accessStatus.generationsRemaining <= 0) {
      setError('You have reached your free generation limit. Connect a wallet with an eligible NFT to unlock unlimited generations.');
      return;
    }

    if (!conceptPrompt.trim()) { setError('A concept prompt is required.'); return; }
    if (audioTab === 'upload' && !audioFile) { setError('Upload an audio file or switch to URL input.'); return; }
    if (audioTab === 'url' && !audioUrl.trim()) { setError('Provide an audio URL.'); return; }

    setError(null);
    setLoading(true);

    // 1 — Upload audio file to Supabase Storage (if file mode)
    let resolvedAudioUrl: string | null = audioTab === 'url' ? audioUrl : null;
    if (audioTab === 'upload' && audioFile) {
      const { url, error: uploadError } = await uploadAudio(audioFile, user.id);
      if (uploadError || !url) {
        setError(uploadError?.message ?? 'Audio upload failed.');
        setLoading(false);
        return;
      }
      resolvedAudioUrl = url;
    }

    // 2 — Upload character reference images (if any)
    const characterImageUrls: string[] = [];
    for (const file of characterFiles) {
      const { url, error: imgErr } = await uploadCharacterImage(file, user.id);
      if (url) characterImageUrls.push(url);
      else if (imgErr) console.warn('Character upload failed:', imgErr.message);
    }

    // 3 — Create project
    const { data: project, error: projError } = await createProject(user.id, {
      title: title.trim() || `${VISUAL_STYLE_LABELS[visualStyle]} — ${new Date().toLocaleDateString()}`,
      concept_prompt: conceptPrompt,
      visual_style: visualStyle,
      mood,
      pacing,
      aspect_ratio: aspectRatio,
      duration_seconds: durationSeconds,
      scene_density: sceneDensity,
      realism_level: realismLevel,
      camera_language: cameraLanguage,
      shot_language: shotLanguage,
      editing_intensity: editingIntensity,
      cinematic_mode: cinematicMode,
      negative_prompt: negativePrompt || null,
      has_brand_overlay: hasBrandOverlay,
      has_subtitles: hasSubtitles,
      has_style_lock: hasStyleLock,
      quality_guardrails: enableGuardrails,
      lyrics: lyrics || null,
      audio_url: resolvedAudioUrl,
    });

    if (projError || !project) {
      setError(projError?.message ?? 'Failed to create project.');
      setLoading(false);
      return;
    }

    // 4 — Build the config snapshot that travels with every generation job
    const config = {
      concept_prompt: conceptPrompt,
      visual_style: visualStyle,
      mood,
      pacing,
      aspect_ratio: aspectRatio,
      duration_seconds: durationSeconds,
      scene_density: sceneDensity,
      realism_level: realismLevel,
      camera_language: cameraLanguage,
      shot_language: shotLanguage,
      editing_intensity: editingIntensity,
      cinematic_mode: cinematicMode,
      negative_prompt: negativePrompt || null,
      has_brand_overlay: hasBrandOverlay,
      has_subtitles: hasSubtitles,
      has_style_lock: hasStyleLock,
      quality_guardrails: enableGuardrails,
      reference_image_url: null,
      render_profile_id: null,
      character_image_urls: characterImageUrls.length > 0 ? characterImageUrls : null,
    };

    // 5 — Create job + pipeline steps
    const { data: job, error: jobError } = await createGenerationJob(project.id, user.id, config);
    setLoading(false);

    if (jobError || !job) {
      setError(jobError?.message ?? 'Failed to start generation.');
      return;
    }

    await createGenerationSteps(job.id);

    // 6 — Navigate immediately; pipeline runs in the background
    navigate(`/dashboard/projects/${project.id}`);

    // Fire-and-forget: errors are caught and persisted inside runPipeline
    runPipeline(job);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">New Clip</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Define the creative direction. The pipeline handles the rest.
            </p>
          </div>
          {!isPremium && accessStatus && (
            <div className={cn(
              'flex-shrink-0 rounded-lg border px-3 py-2 text-right',
              accessStatus.generationsRemaining <= 0
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-border/50 bg-secondary/20'
            )}>
              <p className={cn(
                'text-sm font-semibold tabular-nums',
                accessStatus.generationsRemaining <= 0 ? 'text-destructive' : 'text-foreground'
              )}>
                {accessStatus.generationsRemaining} / {accessStatus.generationsTotal}
              </p>
              <p className="text-xs text-muted-foreground">generations left</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Audio */}
        <Section title="Audio Source">
          <Tabs value={audioTab} onValueChange={(v) => setAudioTab(v as 'upload' | 'url')}>
            <TabsList className="bg-secondary/30 border border-border/40 h-9">
              <TabsTrigger value="upload" className="text-xs">Upload File</TabsTrigger>
              <TabsTrigger value="url" className="text-xs">URL / Link</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-3">
              {audioFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{audioFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button type="button" onClick={() => setAudioFile(null)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
                </div>
              ) : (
                <div
                  className="rounded-lg border-2 border-dashed border-border/40 bg-secondary/10 p-8 text-center cursor-pointer hover:border-border/60 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drop audio file or click to browse</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">MP3, WAV, FLAC, AAC · Max 100 MB</p>
                  <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="url" className="mt-3">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="url" placeholder="https://..." value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="pl-9 bg-secondary/20 border-border/60" />
              </div>
            </TabsContent>
          </Tabs>
        </Section>

        <Separator className="bg-border/30" />

        {/* Character References */}
        <Section title="Character References" badge="Optional">
          <p className="text-xs text-muted-foreground/70 mb-3">
            Upload photos or illustrations of characters — the AI will feature them in your clip's scenes.
            JPG, PNG, WebP · Max 5 MB per image · Up to 4 characters.
          </p>

          <div className="flex flex-wrap gap-3">
            {/* Existing previews */}
            {characterPreviews.map((src, i) => (
              <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border/50 bg-secondary/20 flex-shrink-0">
                <img src={src} alt={characterFiles[i]?.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeCharacter(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${characterFiles[i]?.name}`}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}

            {/* Add button (hidden once 4 reached) */}
            {characterFiles.length < 4 && (
              <button
                type="button"
                onClick={() => characterInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border/40 bg-secondary/10 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 flex-shrink-0"
              >
                <ImagePlus className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50">Add</span>
              </button>
            )}
            <input
              ref={characterInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleCharacterFilesChange}
            />
          </div>

          {characterFiles.length > 0 && (
            <p className="text-xs text-primary/70 mt-2">
              {characterFiles.length} character{characterFiles.length > 1 ? 's' : ''} — the AI will use these as reference frames via Kling image-to-video.
            </p>
          )}
        </Section>

        <Separator className="bg-border/30" />

        {/* Creative Brief */}
        <Section title="Creative Brief">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Project Title</Label>
              <Input placeholder="Leave blank to auto-generate" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary/20 border-border/60 focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Concept Prompt <span className="text-destructive">*</span></Label>
              <Textarea placeholder="Describe the visual world of this track. Be specific about atmosphere, setting, and character." value={conceptPrompt} onChange={(e) => setConceptPrompt(e.target.value)} rows={3} className="bg-secondary/20 border-border/60 focus:border-primary/50 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Lyrics (optional)</Label>
              <Textarea placeholder="Paste lyrics for subtitle rendering or concept alignment." value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={3} className="bg-secondary/20 border-border/60 focus:border-primary/50 resize-none font-mono text-xs" />
            </div>
          </div>
        </Section>

        {/* Quick Presets */}
        <Section title="Quick Presets" badge="Optional">
          <div className="flex flex-wrap gap-2">
            {PROMPT_PRESETS.map((preset) => (
              <button key={preset.id} type="button" onClick={() => applyPreset(preset)} className="rounded-full border border-border/50 bg-secondary/20 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all">
                {preset.name}
              </button>
            ))}
          </div>
        </Section>

        <Separator className="bg-border/30" />

        {/* Cinematic Mode */}
        <Section title="Cinematic Mode" badge="Core">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
            {CINEMATIC_MODES.map((mode) => (
              <button key={mode.id} type="button" onClick={() => applyMode(mode.id)} className={cn('rounded-lg border p-3 text-left transition-all', cinematicMode === mode.id ? 'border-primary/50 bg-primary/8' : 'border-border/40 bg-secondary/20 hover:border-border/60')}>
                <p className={cn('text-xs font-semibold mb-0.5', cinematicMode === mode.id ? 'text-primary' : 'text-foreground')}>{mode.label}</p>
                <p className="text-[11px] text-muted-foreground/70 leading-tight">{mode.tagline}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">{selectedMode.description}</p>
        </Section>

        {/* Style & Mood */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Section title="Visual Style">
            <OptionGrid options={Object.entries(VISUAL_STYLE_LABELS).map(([v, l]) => ({ value: v as VisualStyle, label: l }))} value={visualStyle} onChange={setVisualStyle} columns={2} />
          </Section>
          <Section title="Mood">
            <OptionGrid options={Object.entries(MOOD_LABELS).map(([v, l]) => ({ value: v as Mood, label: l }))} value={mood} onChange={setMood} columns={2} />
          </Section>
        </div>

        {/* Shot Language */}
        <Section title="Shot Language">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SHOT_LANGUAGES.map((shot) => (
              <button key={shot.id} type="button" onClick={() => setShotLanguage(shot.id)} className={cn('rounded-lg border px-3 py-2.5 text-left transition-all', shotLanguage === shot.id ? 'border-primary/50 bg-primary/8 text-foreground' : 'border-border/40 bg-secondary/20 text-muted-foreground hover:border-border/70 hover:text-foreground')}>
                <p className="text-xs font-medium leading-tight">{shot.label}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-tight">{shot.description}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Format */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Section title="Aspect Ratio">
            <OptionGrid options={ASPECT_RATIO_OPTIONS} value={aspectRatio} onChange={setAspectRatio} columns={3} />
          </Section>
          <Section title="Duration">
            <OptionGrid
              options={DURATION_OPTIONS.map((s) => ({ value: String(s) as never, label: s >= 60 ? `${s / 60}m` : `${s}s`, description: s >= 60 ? `${s}s` : '' }))}
              value={String(durationSeconds) as never}
              onChange={(v) => setDurationSeconds(Number(v))}
              columns={3}
            />
          </Section>
        </div>

        {/* Pacing & Scene Density */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Section title="Pacing">
            <OptionGrid options={Object.entries(PACING_LABELS).map(([v, l]) => ({ value: v as Pacing, label: l }))} value={pacing} onChange={setPacing} columns={1} />
          </Section>
          <Section title="Scene Density">
            <OptionGrid options={SCENE_DENSITY_OPTIONS} value={sceneDensity} onChange={setSceneDensity} columns={1} />
          </Section>
        </div>

        {/* Realism */}
        <Section title="Realism Level">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Stylized</span>
              <span className="font-mono text-foreground">{realismLevel}</span>
              <span>Photo Real</span>
            </div>
            <Slider value={[realismLevel]} onValueChange={([v]) => setRealismLevel(v)} min={0} max={100} step={5} className="w-full" />
          </div>
        </Section>

        <Separator className="bg-border/30" />

        {/* Quality Controls */}
        <Section title="Quality Controls" badge="Recommended">
          <div className="space-y-3">
            {[
              { label: 'Realism Guardrails', description: 'Suppress AI artifacts — distorted anatomy, floating objects, color banding', checked: enableGuardrails, onChange: setEnableGuardrails, locked: false },
              { label: 'Style Lock', description: 'Consistent visual style and color grade across all scenes', checked: hasStyleLock, onChange: setHasStyleLock, locked: false },
            ].map(({ label, description, checked, onChange, locked }) => (
              <div key={label} className={cn('flex items-start justify-between gap-4 rounded-lg border border-border/40 bg-secondary/10 p-4', locked && 'opacity-50')}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
                </div>
                <Switch checked={checked} onCheckedChange={onChange} disabled={locked} />
              </div>
            ))}
          </div>
        </Section>

        {/* Advanced */}
        <div>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-6 space-y-8">
              <Section title="Negative Prompt">
                <Textarea placeholder="Describe what to avoid. Standard artifact suppressors are added automatically." value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} rows={2} className="bg-secondary/20 border-border/60 focus:border-primary/50 resize-none font-mono text-xs" />
              </Section>
              <Section title="Output Options" locked={!isPremium} lockedLabel="Pro">
                <div className="space-y-3">
                  {[
                    { label: 'Brand Overlay', description: 'Watermark or logo placement', checked: hasBrandOverlay, onChange: setHasBrandOverlay },
                    { label: 'Subtitles', description: 'Render lyrics as captions', checked: hasSubtitles, onChange: setHasSubtitles },
                  ].map(({ label, description, checked, onChange }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground/70">{description}</p>
                      </div>
                      <Switch checked={checked} onCheckedChange={onChange} disabled={!isPremium} />
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Starting generation...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Generate Clip
                <ChevronRight className="h-4 w-4" />
              </div>
            )}
          </Button>
          <p className="text-xs text-muted-foreground/50 text-center mt-3">
            Generation takes 2–5 minutes depending on duration and render quality.
          </p>
        </div>
      </form>
    </div>
  );
}
