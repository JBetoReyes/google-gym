/**
 * Theme system — premium feature.
 *
 * A Theme defines CSS custom-property overrides applied to :root.
 * The default dark theme is built into index.css and needs no overrides.
 * Each premium theme provides a full token map.
 */
export type ThemeId =
  | 'dark'       // default, free
  | 'midnight'   // premium
  | 'ocean'      // premium
  | 'forest'     // premium
  | 'rose';      // premium

export const FREE_THEME: ThemeId = 'dark';
export const PREMIUM_THEMES: ThemeId[] = ['midnight', 'ocean', 'forest', 'rose'];

export interface ThemeTokens {
  /** Page background */
  bgPage: string;
  /** Card/panel background */
  bgCard: string;
  /** Input/control background */
  bgInput: string;
  /** Default border */
  border: string;
  /** Primary text */
  textPrimary: string;
  /** Secondary text */
  textSecondary: string;
  /** Muted text */
  textMuted: string;
  /** Primary action color */
  accent: string;
  /** Primary action hover */
  accentHover: string;
  /** Success color */
  success: string;
  /** Danger/destructive color */
  danger: string;
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  dark: {
    bgPage:        '#020617', // slate-950
    bgCard:        '#1e293b', // slate-800
    bgInput:       '#1e293b',
    border:        'rgba(51,65,85,0.5)', // slate-700/50
    textPrimary:   '#ffffff',
    textSecondary: '#94a3b8', // slate-400
    textMuted:     '#64748b', // slate-500
    accent:        '#2563eb', // blue-600
    accentHover:   '#3b82f6', // blue-500
    success:       '#10b981', // emerald-500
    danger:        '#ef4444', // red-500
  },
  midnight: {
    bgPage:        '#0a0a1a',
    bgCard:        '#13132b',
    bgInput:       '#1a1a35',
    border:        'rgba(99,102,241,0.25)', // indigo tint
    textPrimary:   '#e2e8f0',
    textSecondary: '#a5b4fc', // indigo-300
    textMuted:     '#6366f1', // indigo-500
    accent:        '#6366f1',
    accentHover:   '#818cf8',
    success:       '#34d399',
    danger:        '#f87171',
  },
  ocean: {
    bgPage:        '#020c18',
    bgCard:        '#0a2033',
    bgInput:       '#0f2d47',
    border:        'rgba(14,165,233,0.2)', // sky tint
    textPrimary:   '#f0f9ff',
    textSecondary: '#7dd3fc', // sky-300
    textMuted:     '#0ea5e9', // sky-500
    accent:        '#0ea5e9',
    accentHover:   '#38bdf8',
    success:       '#2dd4bf',
    danger:        '#fb7185',
  },
  forest: {
    bgPage:        '#030d06',
    bgCard:        '#0d2211',
    bgInput:       '#122b16',
    border:        'rgba(34,197,94,0.2)', // green tint
    textPrimary:   '#f0fdf4',
    textSecondary: '#86efac', // green-300
    textMuted:     '#22c55e', // green-500
    accent:        '#16a34a',
    accentHover:   '#22c55e',
    success:       '#4ade80',
    danger:        '#f87171',
  },
  rose: {
    bgPage:        '#120d11',
    bgCard:        '#1f1520',
    bgInput:       '#2a1c2b',
    border:        'rgba(216,180,254,0.15)', // soft purple-pink tint
    textPrimary:   '#fdf4ff',
    textSecondary: '#e9b8f0', // soft lavender-pink
    textMuted:     '#c084fc', // muted violet
    accent:        '#d946a8', // deep pink (not neon)
    accentHover:   '#e879c0',
    success:       '#34d399',
    danger:        '#f87171',
  },
};

/** Convert ThemeTokens to CSS custom property declarations */
export function themeToCSS(tokens: ThemeTokens): string {
  return `
    --bg-page: ${tokens.bgPage};
    --bg-card: ${tokens.bgCard};
    --bg-input: ${tokens.bgInput};
    --border: ${tokens.border};
    --text-primary: ${tokens.textPrimary};
    --text-secondary: ${tokens.textSecondary};
    --text-muted: ${tokens.textMuted};
    --accent: ${tokens.accent};
    --accent-hover: ${tokens.accentHover};
    --success: ${tokens.success};
    --danger: ${tokens.danger};
  `.trim();
}
