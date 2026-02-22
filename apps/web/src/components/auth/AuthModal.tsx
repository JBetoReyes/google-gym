/**
 * AuthModal — Login/Register tabs with optional post-auth migration prompt.
 *
 * Steps:
 *   1. Login or Register form
 *   2. Migration prompt (if localStorage has data after sign-in)
 *   3. Auto-close (brief confirmation if no migration needed)
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check, CloudUpload, LogIn, UserPlus, X } from 'lucide-react';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useStorage } from '@/hooks/useStorage';

interface Props {
  onClose: () => void;
}

type Tab = 'login' | 'register';
type Step = 'form' | 'verify-email' | 'migrate' | 'done';

function hasLocalData(): boolean {
  if (localStorage.getItem(STORAGE_KEYS.SYNCED)) return false;
  return !!(
    localStorage.getItem(STORAGE_KEYS.ROUTINES) ||
    localStorage.getItem(STORAGE_KEYS.HISTORY) ||
    localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES)
  );
}

function getLocalCounts(): { routines: number; sessions: number } {
  try {
    const r = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    const h = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return {
      routines: r ? (JSON.parse(r) as unknown[]).length : 0,
      sessions: h ? (JSON.parse(h) as unknown[]).length : 0,
    };
  } catch {
    return { routines: 0, sessions: 0 };
  }
}

export default function AuthModal({ onClose }: Props) {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const { migrateToRemote } = useStorage();

  const [tab, setTab] = useState<Tab>('login');
  const [step, setStep] = useState<Step>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Capture counts before auth switches storage mode
  const localCountsRef = useRef<{ routines: number; sessions: number } | null>(null);

  // Auto-close after "done" confirmation
  useEffect(() => {
    if (step !== 'done') return;
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [step, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Snapshot local data counts BEFORE auth flips storage mode
    const hadData = hasLocalData();
    if (hadData) {
      localCountsRef.current = getLocalCounts();
    }

    try {
      if (tab === 'login') {
        await signIn(email, password);
        if (hadData) {
          setStep('migrate');
        } else {
          setStep('done');
        }
      } else {
        await signUp(email, password);
        // signUp may require email confirmation — Supabase returns no session yet
        // We can't migrate until confirmed, so always show verify-email step
        setStep('verify-email');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      await migrateToRemote();
    } catch {
      // Migration failed silently — user still logged in
    } finally {
      localStorage.setItem(STORAGE_KEYS.SYNCED, '1');
      setIsMigrating(false);
      setStep('done');
    }
  };

  const handleSkipMigration = () => {
    localStorage.setItem(STORAGE_KEYS.SYNCED, '1');
    setStep('done');
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
      // Page will redirect to OAuth provider — no further action needed here
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setOauthLoading(null);
    }
  };

  const counts = localCountsRef.current;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-sm relative bg-[var(--bg-card)] border border-[var(--border)]">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>

          {/* ── Step 1: Login / Register form ─────────────────────────── */}
          {step === 'form' && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-[var(--bg-input)] rounded-xl p-1 mb-6">
                {(['login', 'register'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      tab === t
                        ? 'bg-[var(--accent)] text-white shadow'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                {tab === 'login'
                  ? <><LogIn size={20} className="text-[var(--accent)]" /> Sign in to GymTracker</>
                  : <><UserPlus size={20} className="text-[var(--accent)]" /> Create your account</>
                }
              </h2>

              {/* ── OAuth providers ──────────────────────────────────── */}
              <div className="space-y-2 mb-5">
                <button
                  type="button"
                  disabled={oauthLoading !== null}
                  onClick={() => void handleOAuth('google')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-all disabled:opacity-60"
                >
                  {oauthLoading === 'google' ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>

                <button
                  type="button"
                  disabled={oauthLoading !== null}
                  onClick={() => void handleOAuth('facebook')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#1877F2] bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#1464d8] transition-all disabled:opacity-60"
                >
                  {oauthLoading === 'facebook' ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  Continue with Facebook
                </button>
              </div>

              {/* ── Divider ──────────────────────────────────────────── */}
              <div className="relative flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-muted)] font-medium">or continue with email</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 animate-in slide-in-from-top-1">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center"
                  icon={tab === 'login' ? LogIn : UserPlus}
                  disabled={isLoading}
                >
                  {isLoading
                    ? tab === 'login' ? 'Signing in…' : 'Creating account…'
                    : tab === 'login' ? 'Sign In' : 'Create Account'
                  }
                </Button>
              </form>
            </>
          )}

          {/* ── Step: Verify email (after register) ───────────────────── */}
          {step === 'verify-email' && (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-3xl">📬</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Check your email</h2>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                We sent a confirmation link to <span className="font-semibold text-[var(--text-primary)]">{email}</span>.
                Open it to activate your account, then sign in.
              </p>
              <Button variant="secondary" className="w-full justify-center" onClick={() => { setStep('form'); setTab('login'); }}>
                Back to Sign In
              </Button>
            </div>
          )}

          {/* ── Step 2: Migration prompt ───────────────────────────────── */}
          {step === 'migrate' && (
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CloudUpload size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Sync your local data?</h2>
                  <p className="text-[var(--text-muted)] text-sm">We found data saved on this device</p>
                </div>
              </div>

              {counts && (counts.routines > 0 || counts.sessions > 0) && (
                <div className="bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-4 space-y-1.5 text-sm">
                  {counts.routines > 0 && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Routines</span>
                      <span className="font-bold text-[var(--text-primary)]">{counts.routines}</span>
                    </div>
                  )}
                  {counts.sessions > 0 && (
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Workout sessions</span>
                      <span className="font-bold text-[var(--text-primary)]">{counts.sessions}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Syncing will upload your local routines, history, and custom exercises to your account so they're available everywhere.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  icon={CloudUpload}
                  onClick={handleMigrate}
                  disabled={isMigrating}
                >
                  {isMigrating ? 'Syncing…' : 'Sync to cloud'}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={handleSkipMigration}
                  disabled={isMigrating}
                >
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ──────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in">
                <Check size={32} className="text-emerald-400" strokeWidth={3} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">You're in!</h2>
              <p className="text-[var(--text-muted)] text-sm">Welcome to GymTracker.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
