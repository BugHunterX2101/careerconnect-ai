import { alpha } from '@mui/material/styles';
import { colors } from './colors';

export const components = {
  MuiCssBaseline: {
    styleOverrides: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        scroll-behavior: smooth;
      }
      
      body {
        background-color: ${colors.background.default};
        color: ${colors.text.primary};
      }
      
      ::selection {
        background-color: ${alpha(colors.accent[500], 0.3)};
        color: ${colors.text.primary};
      }
      
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      
      ::-webkit-scrollbar-track {
        background: ${colors.neutral[100]};
        border-radius: 6px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%);
        border-radius: 6px;
        border: 2px solid ${colors.neutral[100]};
        transition: all 0.3s ease;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[800]} 100%);
        box-shadow: 0 0 8px ${alpha(colors.primary[600], 0.4)};
      }
    `,
  },
  
  MuiButton: {
    defaultProps: {
      disableElevation: false,
    },
    styleOverrides: {
      root: {
        borderRadius: 14,
        padding: '16px 40px',
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'none',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(61, 47, 35, 0.1)',
      },
      contained: {
        background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
        color: '#FFFFFF',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px rgba(139, 111, 71, 0.25), 0 6px 12px rgba(139, 111, 71, 0.15)',
          background: `linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[800]} 100%)`,
        },
        '&:active': {
          transform: 'translateY(-1px)',
        },
      },
      outlined: {
        borderWidth: 2,
        borderColor: colors.primary[600],
        color: colors.primary[700],
        '&:hover': {
          borderWidth: 2,
          backgroundColor: alpha(colors.primary[50], 0.5),
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(139, 111, 71, 0.15)',
        },
      },
      text: {
        '&:hover': {
          backgroundColor: alpha(colors.accent[200], 0.3),
          transform: 'scale(1.02)',
        },
      },
    },
  },
  
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 20,
        border: `1px solid ${colors.neutral[200]}`,
        backgroundColor: colors.background.paper,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 32px rgba(61, 47, 35, 0.15), 0 6px 16px rgba(61, 47, 35, 0.08)',
          borderColor: colors.primary[300],
          backgroundColor: '#FFFFFF',
        },
      },
    },
  },
  
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 24,
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
        fontSize: '0.875rem',
        letterSpacing: '0.02em',
        padding: '10px 18px',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 4px 12px rgba(139, 111, 71, 0.2)',
        },
      },
      filled: {
        backgroundColor: colors.accent[200],
        color: colors.primary[800],
        '&:hover': {
          backgroundColor: colors.accent[300],
        },
      },
    },
  },
  
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
    },
  },
  
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        fontFamily: '"Inter", sans-serif',
        fontSize: '1.25rem',
        backgroundColor: colors.background.elevated,
        transition: 'all 0.3s ease',
        
        '&:hover': {
          backgroundColor: alpha(colors.accent[50], 0.5),
        },
        
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.primary[500],
          borderWidth: 2,
        },
        
        '&.Mui-focused': {
          backgroundColor: '#FFFFFF',
          transform: 'scale(1.01)',
        },
        
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
          borderColor: colors.primary[600],
          boxShadow: `0 0 0 4px ${alpha(colors.primary[200], 0.25)}`,
        },
      },
      notchedOutline: {
        borderColor: colors.neutral[300],
        transition: 'all 0.3s ease',
      },
      input: {
        padding: '16px 18px',
        fontSize: '1.25rem',
      },
    },
  },
  
  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '1.25rem',
        fontWeight: 500,
        color: colors.text.secondary,
        '&.Mui-focused': {
          color: colors.primary[700],
          fontWeight: 600,
        },
      },
    },
  },
  
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 20,
        backgroundColor: colors.background.paper,
        border: `1px solid ${colors.neutral[200]}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: colors.accent[300],
          boxShadow: '0 8px 20px rgba(61, 47, 35, 0.1)',
        },
      },
    },
  },
  
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(colors.background.paper, 0.95),
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.neutral[200]}`,
        boxShadow: '0 2px 12px rgba(61, 47, 35, 0.08)',
        transition: 'all 0.3s ease',
      },
    },
  },
  
  MuiListItem: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        transition: 'all 0.25s ease',
        '&:hover': {
          backgroundColor: alpha(colors.accent[100], 0.4),
          transform: 'translateX(4px)',
        },
      },
    },
  },
  
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        margin: '4px 8px',
        fontSize: '1.25rem',
        padding: '12px 16px',
        transition: 'all 0.25s ease',
        '&:hover': {
          backgroundColor: alpha(colors.accent[200], 0.5),
          transform: 'translateX(4px)',
        },
      },
    },
  },
  
  MuiTableCell: {
    styleOverrides: {
      root: {
        fontSize: '1.125rem',
        padding: '16px',
        borderColor: colors.neutral[200],
      },
      head: {
        fontSize: '1.25rem',
        fontWeight: 600,
        color: colors.text.primary,
        backgroundColor: alpha(colors.accent[100], 0.3),
      },
    },
  },
  
  MuiChip: {
    styleOverrides: {
      root: {
        fontSize: '1.125rem',
        height: 'auto',
        padding: '8px 4px',
      },
    },
  },
};
