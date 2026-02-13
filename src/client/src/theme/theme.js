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
      main: colors.accent[600],
      light: colors.accent[400],
      dark: colors.accent[800],
      contrastText: colors.text.primary,
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
  },
  
  typography,
  
  shape: {
    borderRadius: 14,
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
});

export default theme;
export { theme };