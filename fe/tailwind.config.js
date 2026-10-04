import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(250, 204, 21, 0.4)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'inner-deep': 'inset 0 2px 10px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        tycoon: {
          "primary": "#f59e0b",
          "primary-content": "#1a1203",
          "secondary": "#3b82f6",
          "secondary-content": "#eff6ff",
          "accent": "#10b981",
          "accent-content": "#022c1c",
          "neutral": "#1e293b",
          "neutral-content": "#cbd5e1",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#e2e8f0",
          "info": "#06b6d4",
          "info-content": "#083344",
          "success": "#22c55e",
          "success-content": "#052e16",
          "warning": "#f59e0b",
          "warning-content": "#1a1203",
          "error": "#ef4444",
          "error-content": "#450a0a",
          "--rounded-box": "0.85rem",
          "--rounded-btn": "0.6rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1.5px",
          "--tab-border": "2px",
          "--tab-radius": "0.5rem",
        },
      },
      'dark',
    ],
  },
};
