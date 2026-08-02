/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: '#080C14',
        cardDark: '#0F172A',
        cardBorder: '#1E293B',
        accentCyan: '#06B6D4',
        accentEmerald: '#10B981',
        accentViolet: '#8B5CF6',
        accentRose: '#F43F5E',
        glowCyan: 'rgba(6, 182, 212, 0.15)',
        glowEmerald: 'rgba(16, 185, 129, 0.15)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
      }
    },
  },
  plugins: [],
}
