import { theme } from '../../constants/theme';

export const clinicianTheme = {
  bg: theme.green,           // #003b13
  bg2: '#00521a',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.1)',
  border: 'rgba(255,255,255,0.09)',
  borderTeal: 'rgba(93,202,165,0.2)',

  teal: theme.accentTeal,    // #5dcaa5
  tealDim: 'rgba(93,202,165,0.65)',
  tealBg: 'rgba(93,202,165,0.13)',
  tealBorder: 'rgba(93,202,165,0.25)',

  gold: theme.gold,
  goldBg: 'rgba(231,211,28,0.13)',
  goldBorder: 'rgba(231,211,28,0.25)',

  white: theme.white,
  text1: '#ffffff',
  text2: 'rgba(255,255,255,0.72)',
  text3: 'rgba(255,255,255,0.45)',
  text4: 'rgba(255,255,255,0.22)',

  statusGreen: '#5dcaa5',
  statusGreenBg: 'rgba(93,202,165,0.15)',
  statusYellow: '#e7d31c',
  statusYellowBg: 'rgba(231,211,28,0.15)',
  statusRed: '#ff7070',
  statusRedBg: 'rgba(255,112,112,0.15)',
  statusGray: 'rgba(255,255,255,0.38)',
  statusGrayBg: 'rgba(255,255,255,0.08)',
} as const;
