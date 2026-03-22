import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Wand2, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { supabase } from '../../lib/supabase';
import type { PromptPreset } from '../../types';
import { cn } from '../../lib/utils';

export default function AdminPresets() {
  const [presets, setPresets] = useState<PromptPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<PromptPreset> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPresets(); }, []);

  const loadPresets = async () => {
    const { data } = await supabase.from('prompt_presets').select('*').order('created_at', { ascending: false });
    setPresets(data ?? []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing({
      name: '', description: '', category: 'cinematic', concept_prompt: '',
      visual_style: 'cinematic', mood: 'epic', pacing: 'moderate',
      camera_language: 'static_composed', shot_language: 'cinematic_slow_push',
      editing_intensity: 'standard', cinematic_mode: 'cinematic', realism_level: 80,
      negative_prompt: '', tags: [], is_system: false, is_featured: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (preset: PromptPreset) => { setEditing({ ...preset }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      await supabase.from('prompt_presets').update(editing).eq('id', editing.id);
    } else {
      await supabase.from('prompt_presets').insert(editing);
    }
    setSaving(false);
    setDialogOpen(false);
    setEditing(null);
    loadPresets();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('prompt_presets').delete().eq('id', id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Prompt Presets</h1>
          <p className="text-sm text-muted-foreground mt-1">{presets.length} preset{presets.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Add Preset
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-secondary/20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map((preset) => (
            <div key={preset.id} className="rounded-xl border border-border/50 bg-card/30 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-foreground">{preset.name}</p>
                    {preset.is_featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    {preset.is_system && <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">System</Badge>}
                    <Badge variant="outline" className="text-xs border-primary/25 text-primary">{preset.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    {preset.visual_style} · {preset.mood} · {preset.cinematic_mode}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(preset)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!preset.is_system && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(preset.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Preset' : 'New Preset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { key: 'name', label: 'Name', placeholder: 'Dark Cinematic' },
              { key: 'description', label: 'Description', placeholder: 'Brief description' },
              { key: 'category', label: 'Category', placeholder: 'cinematic' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={(editing as Record<string, string>)?.[key] ?? ''}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="bg-secondary/20 border-border/60"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Concept Prompt</Label>
              <Textarea
                placeholder="The visual concept description..."
                value={editing?.concept_prompt ?? ''}
                onChange={(e) => setEditing((prev) => ({ ...prev, concept_prompt: e.target.value }))}
                rows={3}
                className="bg-secondary/20 border-border/60 resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Negative Prompt</Label>
              <Textarea
                placeholder="What to suppress..."
                value={editing?.negative_prompt ?? ''}
                onChange={(e) => setEditing((prev) => ({ ...prev, negative_prompt: e.target.value }))}
                rows={2}
                className="bg-secondary/20 border-border/60 resize-none text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Featured</Label>
              <Switch checked={editing?.is_featured ?? false} onCheckedChange={(v) => setEditing((prev) => ({ ...prev, is_featured: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving...' : 'Save Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
