import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // NativeWind v4 supports CSS vars in RN via a polyfill
      colors: {
        page:      'var(--bg-page)',
        card:      'var(--bg-card)',
        input:     'var(--bg-input)',
        accent:    'var(--accent)',
        success:   'var(--success)',
        danger:    'var(--danger)',
      },
    },
  },
  plugins: [],
};

export default config;
