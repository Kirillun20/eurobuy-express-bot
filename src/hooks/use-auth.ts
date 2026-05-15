import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';
import { saveUser, getUser as getCachedUser, logout as clearCache } from '@/lib/store';

export function useAuth() {
  const [user, setUser] = useState<User | null>(getCachedUser());
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrate = async (s: Session | null) => {
      if (!mounted) return;
      setSession(s);
      if (!s) {
        clearCache();
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      // Defer DB lookups (must not run inside auth callback synchronously)
      setTimeout(async () => {
        if (!mounted) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', s.user.id)
          .maybeSingle();
        if (mounted && profile) {
          const u: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            euroPoints: profile.euro_points || 0,
          };
          setUser(u);
          saveUser(u);
        }
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', s.user.id)
          .eq('role', 'admin');
        if (mounted) setIsAdmin((roles?.length || 0) > 0);
        if (mounted) setLoading(false);
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      hydrate(s);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      hydrate(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearCache();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return { user, session, isAdmin, loading, signOut, setUser };
}
