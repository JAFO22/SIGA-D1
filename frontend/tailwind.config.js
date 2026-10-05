export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#e2231a',
          600: '#c81e16',
          700: '#a51913',
        },
        ink: {
          950: '#0b1120',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        risk: {
          critico: '#e11d48',
          atencion: '#d97706',
          optimo: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        'card-hover': '0 8px 24px -8px rgba(15,23,42,0.12), 0 4px 8px -4px rgba(15,23,42,0.06)',
        pop: '0 16px 48px -12px rgba(15,23,42,0.24)',
        glow: '0 0 20px rgba(226,35,26,0.15), 0 0 60px rgba(226,35,26,0.08)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-brand': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(226,35,26,0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(226,35,26,0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        'fade-in-up': 'fade-in-up .45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-down': 'fade-in-down .35s ease-out both',
        aurora: 'aurora 12s ease infinite',
        'pulse-brand': 'pulse-brand 2.5s ease-in-out infinite',
        'slide-up': 'slide-up .5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in .4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
