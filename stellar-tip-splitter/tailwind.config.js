/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#070A12',
          900: '#0B0F1A',
          800: '#121828',
          700: '#1B2436',
          600: '#2A3650',
        },
        stellarblue: {
          400: '#7AB6FF',
          500: '#4F9DFF',
          600: '#2E7DE0',
        },
        flare: {
          400: '#FFC53D',
          500: '#FFB100',
          600: '#E69900',
        },
        mist: '#A8B3C7',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(79,157,255,0.25), 0 0 24px -4px rgba(79,157,255,0.35)',
        flareglow: '0 0 0 1px rgba(255,177,0,0.3), 0 0 24px -4px rgba(255,177,0,0.45)',
      },
      keyframes: {
        beam: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseSlow: {
          '0%,100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        beam: 'beam 1s linear infinite',
        pulseSlow: 'pulseSlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
