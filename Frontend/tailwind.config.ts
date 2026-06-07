import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Azul principal — institucional, navbar, botões
        primary: {
          DEFAULT: '#244F8C',
          50:  '#E9EEF4',
          100: '#D3DDE8',
          200: '#A7BCD1',
          300: '#7A9AB9',
          400: '#4E79A2',
          500: '#244F8C',  // Main (Dark Blue)
          600: '#1D4073',  // Hover
          700: '#16315A',  // Dark
          800: '#0F2241',
          900: '#071328',
        },
        // Amarelo destaque — CTAs, badges, ações importantes
        secondary: {
          DEFAULT: '#F2B705',
          50:  '#FEF8E6',
          100: '#FDF1CC',
          200: '#FBE299',
          300: '#F2DFA7',  // Light Yellow
          400: '#F6C433',
          500: '#F2B705',  // Main Yellow
          600: '#F2A20C',  // Darker Yellow/Orange
          700: '#B68A04',
          800: '#795C03',
          900: '#3D2E01',
        },
        // Neutros de identidade
        surface:    '#FFFFFF',
        background: '#F2F2F2',
        muted:      '#6B7C93',
        stroke:     '#E6EEF5',
        // Texto
        ink: '#2B3440',
        // Status
        success: {
          DEFAULT: '#34C759',
          50:  '#F0FFF4',
          100: '#C6F6D5',
          500: '#34C759',
          600: '#28A745',
          700: '#1E7E34',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card:        '0 1px 4px 0 rgba(35,97,146,0.06), 0 4px 16px 0 rgba(35,97,146,0.06)',
        'card-hover':'0 4px 12px 0 rgba(35,97,146,0.10), 0 16px 40px 0 rgba(35,97,146,0.10)',
        'btn':       '0 2px 8px 0 rgba(35,97,146,0.20)',
        'navbar':    '0 1px 0 0 #E6EEF5',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        shimmer:    'shimmer 1.5s infinite linear',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' },              to: { backgroundPosition: '200% 0' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' },     to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}

export default config
