export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '2.5rem'
} as const;

export const radius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  full: '9999px'
} as const;

export const shadows = {
  sm: '0 1px 2px rgb(0 0 0 / 0.15)',
  md: '0 10px 24px rgb(15 23 42 / 0.18)',
  lg: '0 16px 32px rgb(2 6 23 / 0.28)'
} as const;

export const zIndex = {
  base: 1,
  nav: 40,
  sticky: 50,
  overlay: 60,
  modal: 70,
  toast: 80
} as const;

export const durations = {
  fast: 120,
  base: 180,
  slow: 280
} as const;

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem'
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 800
} as const;

export const semanticColors = {
  light: {
    'bg-primary': 'hsl(220 33% 98%)',
    'bg-secondary': 'hsl(220 20% 95%)',
    card: 'hsl(0 0% 100%)',
    'card-hover': 'hsl(220 20% 97%)',
    'border-subtle': 'hsl(220 14% 88%)',
    'text-primary': 'hsl(222 47% 11%)',
    'text-secondary': 'hsl(215 16% 40%)',
    accent: 'hsl(217 91% 60%)',
    'accent-soft': 'hsl(217 91% 93%)',
    danger: 'hsl(0 84% 60%)',
    success: 'hsl(143 72% 38%)'
  },
  dark: {
    'bg-primary': 'hsl(222 47% 8%)',
    'bg-secondary': 'hsl(222 28% 12%)',
    card: 'hsl(222 28% 14%)',
    'card-hover': 'hsl(220 26% 18%)',
    'border-subtle': 'hsl(220 18% 24%)',
    'text-primary': 'hsl(210 40% 96%)',
    'text-secondary': 'hsl(215 18% 72%)',
    accent: 'hsl(199 89% 58%)',
    'accent-soft': 'hsl(199 89% 20%)',
    danger: 'hsl(0 84% 66%)',
    success: 'hsl(146 72% 45%)'
  }
} as const;

export const animation = {
  fadeIn: { duration: durations.base / 1000, ease: 'easeOut' },
  scaleIn: { duration: durations.fast / 1000, ease: 'easeOut' },
  slideUp: { duration: durations.slow / 1000, ease: 'easeOut' },
  numberTicker: { duration: durations.slow / 1000, ease: 'easeInOut' }
} as const;
