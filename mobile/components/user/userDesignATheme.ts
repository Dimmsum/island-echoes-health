import { theme } from '../../constants/theme';

export const userDesignATheme = {
  // Greens – aligned to onboarding brand
  g900: theme.green, // main deep background
  g800: '#004517',
  g700: theme.greenMid,
  g600: theme.greenLight,
  g500: '#118437',
  g400: '#3a9a5c',
  g300: '#5db87a',
  g200: '#9ad4af',
  g100: '#c8ecda',
  g50: '#eaf7f0',

  // Gold / yellow – aligned to onboarding brand
  y900: '#5a3a00',
  y800: '#7a5000',
  y700: theme.goldDim,
  y600: '#d9c818',
  y500: theme.gold,
  y400: theme.gold,
  y300: '#fff066',
  y200: '#fff6a8',
  y100: '#fffbe0',
  y50: '#fffeef',

  white: theme.white,
  off: theme.offWhite,

  text1: '#0d2318',
  text2: '#2d5040',
  text3: '#5a7a68',
} as const;

