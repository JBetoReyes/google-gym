import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { api, setTokenGetter } from '@/services/api';
import type { UserPlan } from '@shared/types/user';
import { STORAGE_KEYS } from '@shared/utils/storage';

function fetchPlan(): Promise<UserPlan> {
  return api.get<{ plan: UserPlan }>('/profile').then(p => p.plan).catch(() => 'free');
}

interface AuthState {
  user: User | null;
  session: Session | null;
  plan: UserPlan;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
  refreshPlan: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<UserPlan>('free');
  const [isLoading, setIsLoading] = useState(true);

  // Wire JWT getter for the API client
  useEffect(() => {
    setTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);

  useEffect(() => {
    // getSession() reads from localStorage synchronously — fast path so the UI
    // doesn't flash "logged out" while waiting for the async INITIAL_SESSION event.
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setSession(data.session);
      setUser(u);
      if (u) fetchPlan().then(setPlan);
      setIsLoading(false);
    });

    // onAuthStateChange handles every subsequent change: sign-in, sign-out,
    // and TOKEN_REFRESHED (fired when an expired access token is silently renewed).
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Skip INITIAL_SESSION — already handled by getSession() above.
      if (event === 'INITIAL_SESSION') return;

      setSession(newSession);
      const u = newSession?.user ?? null;
      setUser(u);
      if (u) {
        fetchPlan().then(setPlan);
      } else {
        setPlan('free');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEYS.SYNCED);
    await supabase.auth.signOut();
  }, []);

  const refreshPlan = useCallback(async () => {
    setPlan(await fetchPlan());
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, plan, isLoading, signIn, signUp, signInWithOAuth, signOut, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
