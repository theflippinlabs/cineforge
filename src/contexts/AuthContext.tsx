import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, AccessStatus } from '../types';
import { resolveAccessStatus } from '../lib/wallet';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  accessStatus: AccessStatus | null;
  loading: boolean;
  refreshAccessStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  accessStatus: null,
  loading: true,
  refreshAccessStatus: async () => {},
});

async function loadUserData(userId: string) {
  const [profileResult, accessResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    resolveAccessStatus(userId).catch(() => null),
  ]);
  return { profile: profileResult.data as Profile | null, accessStatus: accessResult };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccessStatus = async () => {
    if (!user) return;
    const status = await resolveAccessStatus(user.id).catch(() => null);
    if (status) setAccessStatus(status);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { profile, accessStatus } = await loadUserData(session.user.id);
        setProfile(profile);
        setAccessStatus(accessStatus);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const { profile, accessStatus } = await loadUserData(session.user.id);
          setProfile(profile);
          setAccessStatus(accessStatus);
        } else {
          setProfile(null);
          setAccessStatus(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, accessStatus, loading, refreshAccessStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
