/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7', // Primary Ocean Blue
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        sand: {
          50: '#fafaf9',
          100: '#f5f5f4', // Warm yacht deck background
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        soft: '0 1px 2px -1px rgb(15 23 42 / 0.06), 0 2px 8px -3px rgb(15 23 42 / 0.08)',
        'soft-md': '0 2px 6px -2px rgb(15 23 42 / 0.07), 0 8px 20px -8px rgb(15 23 42 / 0.14)',
        'soft-lg': '0 4px 10px -4px rgb(15 23 42 / 0.08), 0 18px 40px -16px rgb(15 23 42 / 0.18)',
        'glow-ocean': '0 0 0 1px rgb(2 132 199 / 0.14), 0 10px 26px -12px rgb(2 132 199 / 0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'karaoke-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slide-in-left 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'karaoke-pulse': 'karaoke-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
