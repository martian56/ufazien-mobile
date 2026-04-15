// OAuth Callback Handler
// This route exists to prevent "Unmatched Route" errors when OAuth redirects occur
// expo-auth-session handles the actual OAuth flow via promptAsync and Linking API
// This component just provides a route for Expo Router to match
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PrimaryBlue } from '@/constants/theme';

export default function OAuthCallback() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // expo-auth-session processes the OAuth redirect via Linking API
    // The promptAsync promise in AuthContext should resolve automatically
    // We just need to wait a moment and then navigate based on auth state

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [router, isAuthenticated]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={PrimaryBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
