import { useTheme } from '@/contexts/ThemeContext';

export const useColorScheme = (): 'light' | 'dark' => useTheme().resolvedTheme;
