/**
 * LayoutContext — provides openSettings() to any component in the tree,
 * so both the sidebar (desktop) and DashboardView (mobile gear icon) can
 * trigger the Settings modal without prop-drilling.
 */
import React, { createContext, useCallback, useContext } from 'react';

interface LayoutState {
  openSettings: () => void;
  openAuth: () => void;
  openUpgrade: () => void;
  recordClick: () => void;
}

const LayoutContext = createContext<LayoutState | null>(null);

export function LayoutProvider({
  children,
  onOpenSettings,
  onOpenAuth,
  onOpenUpgrade,
  onRecordClick,
}: {
  children: React.ReactNode;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenUpgrade: () => void;
  onRecordClick: () => void;
}) {
  const openSettings = useCallback(() => onOpenSettings(), [onOpenSettings]);
  const openAuth = useCallback(() => onOpenAuth(), [onOpenAuth]);
  const openUpgrade = useCallback(() => onOpenUpgrade(), [onOpenUpgrade]);
  const recordClick = useCallback(() => onRecordClick(), [onRecordClick]);
  return (
    <LayoutContext.Provider value={{ openSettings, openAuth, openUpgrade, recordClick }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutState {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used inside <Layout>');
  return ctx;
}
