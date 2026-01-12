import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { DataGrid, DataGridProps } from '@mui/x-data-grid';

interface GlassDataGridProps extends DataGridProps {
  glassEffect?: boolean;
  containerProps?: BoxProps;
}

export const GlassDataGrid: React.FC<GlassDataGridProps> = ({
  glassEffect = true,
  containerProps,
  sx,
  ...props
}) => {
  return (
    <Box
      {...containerProps}
      sx={{
        background: glassEffect 
          ? 'rgba(255, 255, 255, 0.85)'
          : 'transparent',
        backdropFilter: glassEffect ? 'blur(16px)' : 'none',
        border: glassEffect 
          ? '1px solid rgba(255, 255, 255, 0.3)'
          : 'none',
        borderRadius: 1,
        boxShadow: glassEffect 
          ? '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
          : 'none',
        overflow: 'hidden',
        ...containerProps?.sx,
      }}
    >
      <DataGrid
        sx={{
          border: 'none',
          // Espace et hauteur améliorés
          '& .MuiDataGrid-main': {
            borderRadius: 0,
            minHeight: '600px', // Hauteur minimale pour plus d'espace
          },
          '& .MuiDataGrid-columnHeaders': {
            background: glassEffect 
              ? 'rgba(255, 215, 0, 0.9)'
              : 'rgba(255, 215, 0, 0.8)',
            color: '#1A1A1A',
            fontWeight: 600,
            backdropFilter: glassEffect ? 'blur(8px)' : 'none',
            borderBottom: glassEffect 
              ? '1px solid rgba(255, 255, 255, 0.3)'
              : 'none',
            position: 'relative',
            padding: '20px 16px', // Plus d'espace dans les en-têtes
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: glassEffect 
                ? 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)'
                : 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
              opacity: 0.8,
              zIndex: -1,
            },
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'transparent',
            padding: '16px 12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiDataGrid-row': {
            minHeight: '85px', // Hauteur de ligne augmentée pour plus d'espace entre les clients
            '&:hover': {
              background: glassEffect 
                ? 'rgba(255, 215, 0, 0.15)'
                : 'rgba(255, 215, 0, 0.1)',
              transform: glassEffect ? 'scale(1.01)' : 'none',
            },
          },
          '& .MuiDataGrid-cell': {
            borderBottom: glassEffect 
              ? '2px solid rgba(255, 215, 0, 0.2)'
              : '2px solid rgba(255, 215, 0, 0.15)',
            background: glassEffect 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(255, 255, 255, 0.95)',
            transition: glassEffect ? 'all 0.3s ease' : 'none',
            padding: '16px 12px',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
          '& .MuiDataGrid-footerContainer': {
            background: glassEffect 
              ? 'rgba(255, 255, 255, 0.9)'
              : 'transparent',
            borderTop: glassEffect 
              ? '1px solid rgba(255, 215, 0, 0.15)'
              : '1px solid rgba(255, 215, 0, 0.1)',
            padding: '16px', // Plus d'espace dans le pied de page
          },
          '& .MuiDataGrid-toolbarContainer': {
            background: glassEffect 
              ? 'rgba(255, 255, 255, 0.95)'
              : 'transparent',
            borderBottom: glassEffect 
              ? '1px solid rgba(255, 215, 0, 0.1)'
              : 'none',
            padding: '20px 16px', // Plus d'espace dans la barre d'outils
          },
          // Amélioration du défilement et de l'espace global
          '& .MuiDataGrid-virtualScroller': {
            overflowY: 'auto',
            overflowX: 'auto',
            minHeight: '500px', // Hauteur minimale pour la zone de défilement
          },
          '& .MuiDataGrid-overlayWrapper': {
            minHeight: '400px', // Hauteur minimale pour les états vides ou de chargement
          },
          ...sx,
        }}
        {...props}
      />
    </Box>
  );
};

export default GlassDataGrid;
