import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { supabase } from '../../lib/supabase';
import type { NFTAccessRule } from '../../types';
import { cn } from '../../lib/utils';

const EMPTY_RULE: Omit<NFTAccessRule, 'id' | 'created_at'> = {
  name: '',
  contract_address: '',
  chain_id: 1,
  chain: 'Ethereum',
  collection_name: '',
  token_standard: 'ERC-721',
  required_balance: 1,
  tier_unlocked: 'premium',
  is_active: true,
  description: null,
};

export default function AdminAccessRules() {
  const [rules, setRules] = useState<NFTAccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<NFTAccessRule> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    const { data } = await supabase.from('nft_access_rules').select('*').order('created_at', { ascending: false });
    setRules(data ?? []);
    setLoading(false);
  };

  const openNew = () => { setEditing({ ...EMPTY_RULE }); setDialogOpen(true); };
  const openEdit = (rule: NFTAccessRule) => { setEditing({ ...rule }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    if (editing.id) {
      await supabase.from('nft_access_rules').update(editing).eq('id', editing.id);
    } else {
      await supabase.from('nft_access_rules').insert(editing);
    }
    setSaving(false);
    setDialogOpen(false);
    setEditing(null);
    loadRules();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('nft_access_rules').delete().eq('id', id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleActive = async (rule: NFTAccessRule) => {
    await supabase.from('nft_access_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">NFT Access Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">{rules.length} rule{rules.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-secondary/20 animate-pulse" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-secondary/5 p-16 text-center">
          <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground">No access rules</p>
          <p className="text-xs text-muted-foreground mt-1">Add an NFT contract to enable gated access.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className={cn('rounded-xl border bg-card/30 p-5', rule.is_active ? 'border-border/50' : 'border-border/20 opacity-60')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{rule.name || rule.collection_name}</p>
                    <Badge variant="outline" className={cn('text-xs', rule.is_active ? 'border-success/30 text-success' : 'border-border text-muted-foreground')}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-primary/25 text-primary">{rule.tier_unlocked}</Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground/60 truncate">{rule.contract_address}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.chain} · {rule.token_standard} · Min balance: {rule.required_balance}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_active} onCheckedChange={() => toggleActive(rule)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Access Rule' : 'New Access Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { key: 'name', label: 'Rule Name', placeholder: 'e.g. Genesis Pass' },
              { key: 'contract_address', label: 'Contract Address', placeholder: '0x...' },
              { key: 'collection_name', label: 'Collection Name', placeholder: 'e.g. Synema Genesis' },
              { key: 'chain', label: 'Chain', placeholder: 'Ethereum' },
              { key: 'tier_unlocked', label: 'Tier Unlocked', placeholder: 'premium' },
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
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch checked={editing?.is_active ?? true} onCheckedChange={(v) => setEditing((prev) => ({ ...prev, is_active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? 'Saving...' : 'Save Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
