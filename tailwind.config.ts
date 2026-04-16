import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FAF5FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C5CFC',
          600: '#6D28D9',
          700: '#5B21B6',
          900: '#2E1065',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft:    '#F9F5FF',
          muted:   '#F3EEFF',
          border:  '#E5D9FD',
        },
        night: {
          bg:     '#0D0A1E',
          card:   '#161028',
          muted:  '#1E1538',
          border: '#2D1F58',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(124, 92, 252, 0.08)',
        card: '0 4px 24px 0 rgba(124, 92, 252, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
