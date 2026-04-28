import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Theme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const buildNavTheme = (isDark: boolean): Theme => ({
  dark: isDark,
  colors: {
    primary: Colors[isDark ? 'dark' : 'light'].primary,
    background: Colors[isDark ? 'dark' : 'light'].background,
    card: Colors[isDark ? 'dark' : 'light'].card,
    text: Colors[isDark ? 'dark' : 'light'].text,
    border: Colors[isDark ? 'dark' : 'light'].borderSubtle,
    notification: Colors[isDark ? 'dark' : 'light'].error,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
});

function RootLayoutInner() {
  const { resolvedTheme, colors } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navTheme = buildNavTheme(isDark);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.card);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, colors.card]);

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: navTheme.colors.card,
          },
          headerTintColor: navTheme.colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: navTheme.colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="blog/[id]" options={{ headerShown: false, title: 'Blog Post' }} />
        <Stack.Screen name="user-sites" options={{ headerShown: false }} />
        <Stack.Screen name="hosting" options={{ headerShown: false }} />
        <Stack.Screen name="feedback" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
