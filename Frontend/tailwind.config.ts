import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
          500: '#244F8C',  // Main — "primary-container" do Stitch (Dark Blue)
          600: '#1D4073',  // Hover
          700: '#16315A',  // Dark
          800: '#003773',  // Stitch "primary" — headers/hero em fundo escuro
          900: '#071328',
        },
        // Amarelo destaque — CTAs, badges, ações importantes
        secondary: {
          DEFAULT: '#FCC019',
          50:  '#FEF8E6',
          100: '#FDF1CC',
          200: '#FBE299',
          300: '#F2DFA7',  // Light Yellow
          400: '#FDD65C',
          500: '#FCC019',  // Main Yellow — secondary-container do Stitch
          600: '#F2A20C',  // Darker Yellow/Orange
          700: '#B68A04',
          800: '#795C03',
          900: '#3D2E01',
        },
        // Neutros de identidade
        surface:    '#FFFFFF',
        background: '#FBF9F8',
        muted:      '#434750',
        stroke:     '#C3C6D1',
        // Texto
        ink: '#1B1C1C',
        // Status
        success: {
          DEFAULT: '#34C759',
          50:  '#F0FFF4',
          100: '#C6F6D5',
          500: '#34C759',
          600: '#28A745',
          700: '#1E7E34',
        },
        error: {
          DEFAULT: '#BA1A1A',
          50:  '#FFDAD6',
          100: '#FFB4AB',
          500: '#BA1A1A',
          600: '#93000A',
          700: '#690005',
        },
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['Nunito Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':   '0.75rem',
        '2xl':  '1.5rem',   // 24px — cards
        '3xl':  '2rem',     // 32px — cards grandes
        'pill': '9999px',
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
        'tab-in':   'tabIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' },              to: { backgroundPosition: '200% 0' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' },     to: { opacity: '1', transform: 'scale(1)' } },
        tabIn:   { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
