import { createTheme } from '@mui/material/styles';

export const goldenIceTheme = createTheme({
  palette: {
    primary: {
      main: '#EAE0BD', // Beige doré
      light: '#EEE5CD', // Beige très pâle
      dark: '#EADFBC', // Beige clair
      contrastText: '#1A1A1A',
    },
    secondary: {
      main: '#EFE6CF', // Beige crème
      light: '#EEE5CE', // Beige doux
      dark: '#EFE6CE', // Beige sable
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#EEE5CD', // Beige très pâle comme fond
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#0D0D0D',
      secondary: '#555555',
      disabled: '#999999',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F57C00',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#388E3C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#0D0D0D',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 10px rgba(234, 224, 189, 0.3)',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#0D0D0D',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      background: 'linear-gradient(135deg, #EAE0BD 0%, #EFE6CF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#0D0D0D',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
      background: 'linear-gradient(135deg, #EADFBC 0%, #EEE5CE 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#0D0D0D',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#0D0D0D',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#333333',
      lineHeight: 1.4,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#0D0D0D',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#444444',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#0D0D0D',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#555555',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(234, 224, 189, 0.3)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
          color: '#1A1A1A',
          fontWeight: 600,
          letterSpacing: '0.01em',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #EEE5CD 0%, #EAE0BD 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #EFE6CF 0%, #EEE5CE 100%)',
          color: '#1A1A1A',
          fontWeight: 600,
          letterSpacing: '0.01em',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #EEE5CE 0%, #EFE6CF 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          fontWeight: 500,
          letterSpacing: '0.01em',
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '& .MuiCardHeader-title': {
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: '#0D0D0D',
          },
          '& .MuiCardHeader-subheader': {
            letterSpacing: '0.01em',
            color: '#555555',
          },
          '& .MuiCardContent-root': {
            '& .MuiTypography-root': {
              letterSpacing: '0.01em',
            },
            '& .MuiTypography-body1': {
              color: '#0D0D0D',
            },
            '& .MuiTypography-body2': {
              color: '#555555',
            },
          },
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 20px 40px rgba(234, 224, 189, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            background: 'rgba(255, 255, 255, 0.98)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(238, 229, 205, 0.95) 100%)',
          '& .MuiTypography-root': {
            letterSpacing: '0.01em',
          },
          '& .MuiTypography-body1': {
            color: '#0D0D0D',
          },
          '& .MuiTypography-body2': {
            color: '#555555',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
          boxShadow: '0 8px 32px rgba(234, 224, 189, 0.4), 0 2px 8px rgba(239, 230, 206, 0.3)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          '& .MuiTypography-root': {
            fontWeight: 600,
            letterSpacing: '0.01em',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiToolbar-root': {
            '& .MuiTypography-h6': {
              fontWeight: 700,
              letterSpacing: '0.02em',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(238, 229, 205, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(234, 224, 189, 0.3)',
          boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.6)',
          '& .MuiTypography-root': {
            letterSpacing: '0.01em',
          },
          '& .MuiListItemText-primary': {
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: '#0D0D0D',
          },
          '& .MuiListItemText-secondary': {
            letterSpacing: '0.01em',
            color: '#555555',
          },
          '& .MuiListSubheader-root': {
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: '#0D0D0D',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '6px 12px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(234, 224, 189, 0.25) 0%, rgba(234, 223, 188, 0.25) 50%, rgba(239, 230, 206, 0.2) 100%)',
            borderLeft: '4px solid #EAE0BD',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(234, 224, 189, 0.2)',
          },
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(234, 224, 189, 0.15) 0%, rgba(234, 223, 188, 0.15) 50%, rgba(239, 230, 206, 0.1) 100%)',
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
          color: '#0D0D0D',
          fontWeight: 700,
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        body: {
          borderBottom: '1px solid rgba(234, 224, 189, 0.15)',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#0D0D0D',
          fontWeight: 500,
          letterSpacing: '0.01em',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: '#555555',
            '&.Mui-focused': {
              color: '#EAE0BD',
              fontWeight: 600,
            },
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            '& .MuiOutlinedInput-input': {
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: '#0D0D0D',
            },
            '&:hover fieldset': {
              borderColor: '#EAE0BD',
              borderWidth: 2,
            },
            '&.Mui-focused fieldset': {
              borderColor: '#EAE0BD',
              borderWidth: 2,
              boxShadow: '0 0 0 3px rgba(234, 224, 189, 0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          '& .MuiSelect-select': {
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: '#0D0D0D',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#EAE0BD',
            borderWidth: 2,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#EAE0BD',
            borderWidth: 2,
            boxShadow: '0 0 0 3px rgba(234, 224, 189, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          letterSpacing: '0.01em',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
          color: '#0D0D0D',
          fontWeight: 600,
          letterSpacing: '0.01em',
          boxShadow: '0 4px 12px rgba(234, 224, 189, 0.3)',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #E3F2FD 0%, #B3D4FC 50%, #EAE0BD 100%)',
          color: '#0D0D0D',
          fontWeight: 600,
          letterSpacing: '0.01em',
          boxShadow: '0 4px 12px rgba(227, 242, 253, 0.3)',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
          color: '#0D0D0D',
          fontWeight: 700,
          letterSpacing: '0.02em',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 12px rgba(234, 224, 189, 0.3)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(234, 224, 189, 0.2)',
        },
      },
    },
  },
});
