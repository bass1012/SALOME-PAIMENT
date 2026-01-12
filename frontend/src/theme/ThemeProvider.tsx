import React, { createContext, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { goldenIceTheme } from './theme';

interface ThemeContextType {
  theme: typeof goldenIceTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: goldenIceTheme,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: goldenIceTheme }}>
      <MuiThemeProvider theme={goldenIceTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
