/**
 * DashboardView — weekly goal ring, stat cards, charts.
 *
 * Premium gate: ChartSlider (all 5 charts) only for premium users.
 * Free users see basic stats only.
 *
 * TODO: Migrate full DashboardView JSX from v1 src/App.jsx.
 * The component structure, data model, and stat computations are:
 *   - Weekly goal ring: custom SVG circle progress
 *   - Day-of-week dots row
 *   - Stat cards carousel (mobile) / grid (desktop)
 *   - ChartSlider with 5 Recharts charts (premium only)
 * Reference: FEATURES.md §5 Dashboard View
 */
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardView() {
  const { plan } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-4">
      <p className="text-[var(--text-muted)] text-sm">
        DashboardView — migration from App.jsx in progress.
      </p>
      {plan !== 'premium' && (
        <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          Upgrade to Premium to unlock all 5 charts and unlimited routines.
        </div>
      )}
    </div>
  );
}
