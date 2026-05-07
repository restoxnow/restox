import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F97316',
          amber: '#F59E0B',
          rose: '#F43F5E',
          coral: '#FF6B4A',
          warm: '#FFFBF7',
          cream: '#FFF5EC',
          dark: '#1C1108',
          mid: '#6B4C3B',
          light: '#A87C69',
          border: '#F3E8E2',
        },
      },
      fontFamily: {
        heading: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #F97316 0%, #F59E0B 50%, #F43F5E 100%)',
        'gradient-hero': 'linear-gradient(-45deg, #FF9A5A, #FCD34D, #F97316, #F43F5E)',
        'gradient-card': 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 9s ease-in-out 1s infinite',
        'pulse-warm': 'pulseWarm 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        pulseWarm: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'warm-sm': '0 2px 8px rgba(249, 115, 22, 0.12)',
        'warm-md': '0 4px 20px rgba(249, 115, 22, 0.18)',
        'warm-lg': '0 8px 40px rgba(249, 115, 22, 0.22)',
        'warm-xl': '0 16px 60px rgba(249, 115, 22, 0.28)',
        'card': '0 4px 24px rgba(28, 17, 8, 0.08)',
        'card-hover': '0 8px 40px rgba(28, 17, 8, 0.14)',
      },
    },
  },
  plugins: [],
}

export default config
