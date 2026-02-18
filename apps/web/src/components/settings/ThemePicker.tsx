/**
 * ThemePicker — premium feature shown in Settings modal.
 * Free users see the picker but all premium themes are locked (lock icon).
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { FREE_THEME, PREMIUM_THEMES, THEMES, type ThemeId } from '@shared/types/theme';
import type { UserPlan } from '@shared/types/user';
import { useTheme } from '@/context/ThemeContext';

const THEME_LABELS: Record<ThemeId, string> = {
  dark:     'Dark',
  midnight: 'Midnight',
  ocean:    'Ocean',
  forest:   'Forest',
  rose:     'Rose',
};

interface Props {
  plan: UserPlan;
  onUpgradeClick: () => void;
}

export function ThemePicker({ plan, onUpgradeClick }: Props) {
  const { themeId, setTheme } = useTheme();
  const allThemes: ThemeId[] = [FREE_THEME, ...PREMIUM_THEMES];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">App Theme</h3>
        {plan !== 'premium' && (
          <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
            Premium
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {allThemes.map(id => {
          const tokens = THEMES[id];
          const isPremium = id !== FREE_THEME;
          const isLocked = isPremium && plan !== 'premium';
          const isActive = themeId === id;

          return (
            <button
              key={id}
              onClick={() => {
                if (isLocked) { onUpgradeClick(); return; }
                setTheme(id, plan);
              }}
              title={THEME_LABELS[id]}
              className={[
                'relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                isActive
                  ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border)] hover:border-[var(--text-muted)]',
                isLocked ? 'opacity-60' : '',
              ].join(' ')}
            >
              {/* Color swatch */}
              <div
                className="w-8 h-8 rounded-lg shadow-md"
                style={{ background: `linear-gradient(135deg, ${tokens.bgCard}, ${tokens.accent})` }}
              />
              <span className="text-[10px] text-[var(--text-secondary)] leading-tight text-center">
                {THEME_LABELS[id]}
              </span>
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                  <Lock size={12} className="text-[var(--text-muted)]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
