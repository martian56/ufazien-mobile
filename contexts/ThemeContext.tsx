import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Colors } from '@/constants/theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'ufaz_theme_preference';

interface ThemeContextType {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: typeof Colors.light;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemedColors = () => useTheme().colors;

interface ThemeProviderProps {
  children: ReactNode;
}

const resolve = (preference: ThemePreference, system: ColorSchemeName): ResolvedTheme => {
  if (preference === 'system') return system === 'dark' ? 'dark' : 'light';
  return preference;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setPreferenceState(value);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence errors
    }
  }, []);

  const resolvedTheme = resolve(preference, systemScheme);
  const colors = Colors[resolvedTheme];

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, colors, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};
