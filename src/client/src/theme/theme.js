import { createTheme } from '@mui/material/styles';
import { colors } from './colors';
import { typography } from './typography';
import { components } from './components';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[800],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.neutral[700],
      light: colors.neutral[500],
      dark: colors.neutral[900],
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.success[600],
      light: colors.success[500],
      dark: colors.success[700],
    },
    error: {
      main: colors.error[600],
      light: colors.error[500],
      dark: colors.error[700],
    },
    warning: {
      main: colors.warning[600],
      light: colors.warning[500],
      dark: colors.warning[700],
    },
    info: {
      main: colors.info[600],
      light: colors.info[500],
      dark: colors.info[700],
    },
    background: colors.background,
    text: colors.text,
    divider: colors.neutral[200],
    surface: {
      panel: '#FFFFFF',
      section: colors.background.subtle,
      elevated: '#FFFFFF',
      highlight: '#ECF3FF',
    },
    emphasis: {
      soft: colors.primary[50],
      medium: colors.primary[200],
      strong: colors.primary[600],
    },
  },
  
  typography,
  
  shape: {
    borderRadius: 16,
  },
  
  shadows: [
    'none',
    '0 2px 4px rgba(61, 47, 35, 0.08)',
    '0 3px 8px rgba(61, 47, 35, 0.10)',
    '0 4px 12px rgba(61, 47, 35, 0.12)',
    '0 6px 16px rgba(61, 47, 35, 0.14)',
    '0 8px 20px rgba(61, 47, 35, 0.16)',
    '0 10px 24px rgba(61, 47, 35, 0.18)',
    '0 12px 28px rgba(61, 47, 35, 0.20)',
    '0 16px 32px rgba(61, 47, 35, 0.22)',
    '0 20px 40px rgba(61, 47, 35, 0.24)',
    ...Array(15).fill('none'),
  ],
  
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 350,
      complex: 450,
      enteringScreen: 300,
      leavingScreen: 250,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  
  components,

  customTokens: {
    surface: {
      page: colors.background.default,
      panel: colors.background.paper,
      subtle: colors.background.subtle,
      highlight: '#EEF9F7',
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      muted: colors.text.disabled,
    },
    border: {
      subtle: colors.neutral[200],
      strong: colors.accent[300],
    },
    state: {
      success: { fg: colors.success[700], bg: '#F0FDF4' },
      warning: { fg: colors.warning[700], bg: '#FFF7E6' },
      error: { fg: colors.error[700], bg: '#FEF2F2' },
    },
    density: {
      compact: { controlHeight: 36, tableY: 8, cardPadding: 14 },
      standard: { controlHeight: 42, tableY: 12, cardPadding: 18 },
      relaxed: { controlHeight: 48, tableY: 16, cardPadding: 24 },
    },
    elevation: {
      soft: '0 10px 30px rgba(27, 43, 59, 0.08)',
      medium: '0 14px 32px rgba(27, 43, 59, 0.12)',
      elevated: '0 18px 42px rgba(27, 43, 59, 0.14)',
    },
    motion: {
      easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      fast: 140,
      normal: 260,
      slow: 420,
    },
  },
});

export default theme;
export { theme };