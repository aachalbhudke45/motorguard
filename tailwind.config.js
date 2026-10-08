/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: { 950: '#070b12', 900: '#0b111b', 850: '#0f1723', 800: '#131d2c', 700: '#1c2a3d', 600: '#28394f' },
        ok: '#22c55e',
        warn: '#f59e0b',
        crit: '#ef4444',
        accent: '#22d3ee',
      },
      boxShadow: {
        glowok: '0 0 12px rgba(34,197,94,.55)',
        glowwarn: '0 0 12px rgba(245,158,11,.55)',
        glowcrit: '0 0 14px rgba(239,68,68,.65)',
      },
      keyframes: {
        slidein: { '0%': { opacity: 0, transform: 'translateY(-8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadein: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: { slidein: 'slidein .35s ease-out', fadein: 'fadein .3s ease-out' },
    },
  },
  plugins: [],
};
