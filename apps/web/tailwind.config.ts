import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Theme-aware color utilities that read from CSS custom properties.
      // This lets premium themes swap colors by overriding --bg-page etc. at :root.
      colors: {
        page:       'var(--bg-page)',
        card:       'var(--bg-card)',
        input:      'var(--bg-input)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        accent:     'var(--accent)',
        'accent-hover':   'var(--accent-hover)',
        success:    'var(--success)',
        danger:     'var(--danger)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
    },
  },
  plugins: [],
};

export default config;
