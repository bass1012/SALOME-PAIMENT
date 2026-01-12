import React from 'react';
import { Button, ButtonProps } from '@mui/material';

interface LiquidButtonProps extends Omit<ButtonProps, 'variant'> {
  liquidEffect?: boolean;
  variant?: 'gold' | 'ice' | 'gradient';
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  children,
  liquidEffect = true,
  variant = 'gradient',
  sx,
  ...props
}) => {
  const getBackground = () => {
    switch (variant) {
      case 'gold':
        return 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)';
      case 'ice':
        return 'linear-gradient(135deg, #E3F2FD 0%, #B3D4FC 100%)';
      default:
        return 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)';
    }
  };

  return (
    <Button
      sx={{
        borderRadius: 3,
        padding: '12px 28px',
        fontWeight: 600,
        textTransform: 'none',
        background: getBackground(),
        color: '#1A1A1A',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: liquidEffect 
          ? '0 4px 16px rgba(255, 215, 0, 0.3), 0 2px 8px rgba(227, 242, 253, 0.2)'
          : '0 4px 12px rgba(255, 215, 0, 0.2)',
        transition: liquidEffect 
          ? 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          : 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::before': liquidEffect ? {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          transition: 'left 0.5s ease',
        } : {},
        '&:hover': {
          transform: liquidEffect ? 'translateY(-3px) scale(1.05)' : 'translateY(-2px)',
          boxShadow: liquidEffect 
            ? '0 8px 24px rgba(234, 224, 189, 0.4), 0 4px 16px rgba(239, 230, 206, 0.3)'
            : '0 8px 20px rgba(234, 224, 189, 0.3)',
          background: variant === 'gold' 
            ? 'linear-gradient(135deg, #EEE5CE 0%, #EAE0BD 100%)'
            : variant === 'ice'
            ? 'linear-gradient(135deg, #F5F9FF 0%, #E3F2FD 100%)'
            : 'linear-gradient(135deg, #EEE5CE 0%, #EAE0BD 50%, #EFE6CF 100%)',
        },
        '&:hover::before': liquidEffect ? {
          left: '100%',
        } : {},
        '&:active': {
          transform: liquidEffect ? 'translateY(-1px) scale(1.02)' : 'translateY(-1px)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default LiquidButton;
