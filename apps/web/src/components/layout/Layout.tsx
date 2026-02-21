/**
 * Layout — app shell with desktop sidebar + mobile bottom nav.
 * Manages the Settings modal and Auth modal state.
 * Provides openSettings() and openAuth() via LayoutContext.
 * Hidden on /workout route (full-screen workout view).
 */
import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Dumbbell, History, LogOut, Settings, UserPlus } from 'lucide-react';
import { TRANSLATIONS } from '@shared/i18n/translations';
import type { Lang } from '@shared/types/user';
import { STORAGE_KEYS } from '@shared/utils/storage';
import { LayoutProvider } from '@/context/LayoutContext';
import { useAuth } from '@/context/AuthContext';
import { useAds } from '@/hooks/useAds';
import { AdModal } from '@/components/ads/AdModal';
import AuthModal from '@/components/auth/AuthModal';
import { UpgradeModal } from '@/components/ui';

const SettingsModal = lazy(() => import('@/components/settings/SettingsModal'));

function lsLang(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANG);
    if (raw === 'es' || raw === 'en' || raw === 'fr') return raw;
  } catch {}
  return 'en';
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, plan, signOut } = useAuth();

  const { showAd, dismissAd, recordClick } = useAds();

  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [lang, setLang] = useState<Lang>(lsLang);

  // Keep lang in sync when SettingsModal changes it (storage event)
  useEffect(() => {
    const handler = () => setLang(lsLang());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => {
    setShowSettings(false);
    setLang(lsLang());       // refresh lang after settings close
  }, []);

  const openAuth = useCallback(() => setShowAuth(true), []);
  const closeAuth = useCallback(() => setShowAuth(false), []);

  const openUpgrade = useCallback(() => setShowUpgrade(true), []);
  const closeUpgrade = useCallback(() => setShowUpgrade(false), []);

  const t = (key: string): string => {
    const dict = TRANSLATIONS[lang] as unknown as Record<string, string>;
    return dict[key] ?? key;
  };

  const isWorkout = location.pathname === '/workout';

  const navItems = [
    { path: '/dashboard', icon: BarChart3, label: t('dashboard') },
    { path: '/routines',  icon: Dumbbell,  label: t('routines') },
    { path: '/history',   icon: History,   label: t('history') },
  ] as const;

  const isActive = (path: string): boolean =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const isPremium = plan === 'premium';

  return (
    <LayoutProvider onOpenSettings={openSettings} onOpenAuth={openAuth} onOpenUpgrade={openUpgrade} onRecordClick={recordClick}>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent)]/30 pb-safe">
        <div className="max-w-md lg:max-w-6xl mx-auto min-h-screen lg:h-screen flex flex-col lg:flex-row relative">

          {/* ── Desktop sidebar ─────────────────────────────────────────── */}
          {!isWorkout && (
            <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-page)] px-5 py-8">
              <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-10 px-2">
                GYMTRACKER
              </h1>

              <nav className="flex flex-col gap-1 flex-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                        active
                          ? 'bg-[var(--accent)] text-white shadow-lg'
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={openSettings}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition-all"
                >
                  <Settings size={18} />
                  {t('settings')}
                </button>

                {/* Auth section */}
                {user === null ? (
                  <button
                    onClick={openAuth}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-md"
                  >
                    <UserPlus size={18} />
                    Sign In / Sign Up
                  </button>
                ) : (
                  <div className="flex flex-col gap-1">
                    {/* Plan badge + email */}
                    <div className="flex items-center gap-3 px-4 py-2">
                      {isPremium ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                          PRO
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center font-bold text-[9px] text-[var(--text-muted)] shrink-0">
                          FREE
                        </div>
                      )}
                      <span className="text-xs text-[var(--text-muted)] font-medium truncate" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                    <button
                      onClick={() => void signOut()}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--danger)] transition-all"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* ── Right content column ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Mobile sticky header (hidden on /workout) */}
            {!isWorkout && (
              <header className="lg:hidden px-6 pt-8 pb-4 flex justify-between items-center bg-[var(--bg-page)] sticky top-0 z-10">
                <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  GYMTRACKER
                </h1>
                <div className="flex items-center gap-2">
                  {isPremium && user && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-[10px] text-white">
                      PRO
                    </div>
                  )}
                  {user === null && (
                    <button
                      onClick={openAuth}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-md"
                    >
                      <UserPlus size={14} />
                      Sign In
                    </button>
                  )}
                </div>
              </header>
            )}

            {/* Page content */}
            <main
              className={`flex-1 px-4 lg:px-10 scrollbar-hide min-h-0 ${
                isWorkout
                  ? 'overflow-hidden flex flex-col pb-4'
                  : 'overflow-y-auto pb-24 lg:pb-10 lg:pt-8'
              }`}
            >
              {children}
            </main>
          </div>

          {/* ── Mobile bottom nav ────────────────────────────────────────── */}
          {!isWorkout && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-page)]/90 backdrop-blur-xl border-t border-[var(--border)] z-30 pb-safe">
              <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2">
                {navItems.map((tab) => {
                  const active = isActive(tab.path);
                  return (
                    <button
                      key={tab.path}
                      onClick={() => navigate(tab.path)}
                      className={`flex flex-col items-center justify-center w-20 transition-all ${
                        active
                          ? 'text-[var(--accent)] -translate-y-1'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      <tab.icon size={24} strokeWidth={active ? 2.5 : 2} className="mb-1" />
                      <span className="text-[10px] font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>

        {/* ── Settings modal ───────────────────────────────────────────── */}
        {showSettings && (
          <Suspense fallback={null}>
            <SettingsModal onClose={closeSettings} />
          </Suspense>
        )}

        {/* ── Auth modal ───────────────────────────────────────────────── */}
        {showAuth && <AuthModal onClose={closeAuth} />}

        {/* ── Upgrade modal ─────────────────────────────────────────────── */}
        <UpgradeModal isOpen={showUpgrade} onClose={closeUpgrade} />

        {/* ── Ad modal ─────────────────────────────────────────────────── */}
        <AdModal isOpen={showAd} onClose={dismissAd} />
      </div>
    </LayoutProvider>
  );
}
