import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Film } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { supabase } from '../../lib/supabase';
import type { RenderProfile } from '../../types';

const EMPTY: Partial<RenderProfile> = {
  code: '', name: '', description: '', resolution: '1920x1080',
  width: 1920, height: 1080, fps: 24, bitrate_kbps: 8000,
  format: 'mp4', codec: 'h264', tier_required: 'free', is_active: true,
};

export default function AdminRenderProfiles() {
  const [profiles, setProfiles] = useState<RenderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<RenderProfile> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    const { data } = await supabase.from('render_profiles').select('*').order('bitrate_kbps');
    setProfiles(data ?? []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      await supabase.from('render_profiles').update(editing).eq('id', editing.id);
    } else {
      await supabase.from('render_profiles').insert(editing);
    }
    setSaving(false);
    setDialogOpen(false);
    setEditing(null);
    loadProfiles();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('render_profiles').delete().eq('id', id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = async (profile: RenderProfile) => {
    await supabase.from('render_profiles').update({ is_active: !profile.is_active }).eq('id', profile.id);
    setProfiles((prev) => prev.map((p) => p.id === profile.id ? { ...p, is_active: !p.is_active } : p));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Render Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditing({ ...EMPTY }); setDialogOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-secondary/20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="rounded-xl border border-border/50 bg-card/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-border/40 flex items-center justify-center flex-shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{profile.name}</p>
                      <Badge variant="outline" className="text-xs border-primary/25 text-primary">{profile.tier_required}</Badge>
                      {!profile.is_active && <Badge variant="outline" className="text-xs text-muted-foreground/50">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {profile.resolution} · {profile.fps}fps · {profile.codec.toUpperCase()} · {(profile.bitrate_kbps / 1000).toFixed(0)} Mbps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={profile.is_active} onCheckedChange={() => toggleActive(profile)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing({ ...profile }); setDialogOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(profile.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Render Profile' : 'New Render Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { key: 'code', label: 'Code', placeholder: 'hd_1080p' },
              { key: 'name', label: 'Name', placeholder: 'HD 1080p' },
              { key: 'resolution', label: 'Resolution', placeholder: '1920x1080' },
              { key: 'codec', label: 'Codec', placeholder: 'h264' },
              { key: 'tier_required', label: 'Required Tier', placeholder: 'free' },
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
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'fps', label: 'FPS', placeholder: '24' },
                { key: 'bitrate_kbps', label: 'Bitrate (kbps)', placeholder: '8000' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5 col-span-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
                  <Input
                    type="number"
                    placeholder={placeholder}
                    value={(editing as Record<string, number>)?.[key] ?? ''}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="bg-secondary/20 border-border/60"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing((prev) => ({ ...prev, is_active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
