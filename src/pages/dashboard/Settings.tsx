import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setSavingProfile(false);
    setProfileMsg(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Profile updated successfully.' }
    );
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    setPasswordMsg(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Password updated successfully.' }
    );
    if (!error) {
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences.</p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-foreground">Profile</h2>
        </div>

        {profileMsg && (
          <Alert className={profileMsg.type === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'}>
            {profileMsg.type === 'error'
              ? <AlertCircle className="h-4 w-4 text-destructive" />
              : <CheckCircle2 className="h-4 w-4 text-success" />
            }
            <AlertDescription className={profileMsg.type === 'error' ? 'text-destructive' : 'text-success'}>
              {profileMsg.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground/80">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-secondary/20 border-border/60 focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground/80">Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-secondary/10 border-border/40 text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        <Button onClick={handleSaveProfile} disabled={savingProfile} size="sm">
          {savingProfile ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          Save Profile
        </Button>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-foreground">Password</h2>
        </div>

        {passwordMsg && (
          <Alert className={passwordMsg.type === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'}>
            {passwordMsg.type === 'error'
              ? <AlertCircle className="h-4 w-4 text-destructive" />
              : <CheckCircle2 className="h-4 w-4 text-success" />
            }
            <AlertDescription className={passwordMsg.type === 'error' ? 'text-destructive' : 'text-success'}>
              {passwordMsg.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground/80">New Password</Label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-secondary/20 border-border/60 focus:border-primary/50"
            />
          </div>
        </div>

        <Button onClick={handleChangePassword} disabled={changingPassword} size="sm">
          {changingPassword ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          Update Password
        </Button>
      </div>

      <Separator className="bg-border/40" />

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/3 p-6">
        <h2 className="font-semibold text-foreground mb-1">Sign Out</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign out of your Synema account.</p>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="border-destructive/30 text-destructive hover:bg-destructive/5">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
