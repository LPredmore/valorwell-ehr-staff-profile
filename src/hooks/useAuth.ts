import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useIframe } from '@/context/IframeContext';

/**
 * Simplified auth hook that works with or without parent authentication
 * Uses local Supabase auth as primary, parent auth as secondary
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { parentAuth } = useIframe();

  useEffect(() => {
    console.log('[useAuth] Setting up authentication state listener...');
    
    // Set up auth state listener for local Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] Auth state change:', { event, session: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[useAuth] Initial session check:', { session: !!session, error });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Use parent auth if available, otherwise use local auth
  const effectiveUser = parentAuth?.user || user;
  const effectiveSession = parentAuth?.user ? { user: parentAuth.user } as Session : session;

  const signOut = async () => {
    console.log('[useAuth] Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[useAuth] Sign out error:', error);
    }
  };

  return {
    user: effectiveUser,
    session: effectiveSession,
    loading,
    signOut,
  };
};