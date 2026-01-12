import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface GlassCardProps extends BoxProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'heavy';
  liquidEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  liquidEffect = false,
  sx,
  ...props
}) => {
  const getBlurIntensity = () => {
    switch (intensity) {
      case 'light': return 'blur(8px)';
      case 'heavy': return 'blur(24px)';
      default: return 'blur(16px)';
    }
  };

  const getOpacity = () => {
    switch (intensity) {
      case 'light': return 0.7;
      case 'heavy': return 0.95;
      default: return 0.85;
    }
  };

  return (
    <Box
      sx={{
        background: `rgba(255, 255, 255, ${getOpacity()})`,
        backdropFilter: getBlurIntensity(),
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        boxShadow: liquidEffect 
          ? '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 215, 0, 0.1)'
          : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        transition: liquidEffect 
          ? 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          : 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::before': liquidEffect ? {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent, rgba(227, 242, 253, 0.1), transparent)',
          animation: 'liquidShine 3s ease-in-out infinite',
          pointerEvents: 'none',
        } : {},
        '&:hover': liquidEffect ? {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 20px 40px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 215, 0, 0.2)',
          background: `rgba(255, 255, 255, ${Math.min(getOpacity() + 0.1, 1)})`,
        } : {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 36px rgba(255, 215, 0, 0.15)',
        },
        '@keyframes liquidShine': {
          '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '50%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
          '100%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default GlassCard;
