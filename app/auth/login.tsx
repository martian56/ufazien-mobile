import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { ThemeColors } from '@/constants/theme';

const REMEMBERED_EMAIL_KEY = 'ufaz_login_remembered_email';
// Legacy key (pre ufaz_* convention); migrated on read, then removed.
const LEGACY_REMEMBERED_EMAIL_KEY = 'ufazien_login_remembered_email';

export default function LoginScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let saved = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
        if (saved == null) {
          const legacy = await AsyncStorage.getItem(LEGACY_REMEMBERED_EMAIL_KEY);
          if (legacy != null) {
            await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, legacy);
            await AsyncStorage.removeItem(LEGACY_REMEMBERED_EMAIL_KEY);
            saved = legacy;
          }
        }
        if (saved && active) {
          setEmail(saved);
          setRememberMe(true);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      try {
        if (rememberMe) {
          await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
          await AsyncStorage.removeItem(LEGACY_REMEMBERED_EMAIL_KEY);
        } else {
          await AsyncStorage.multiRemove([REMEMBERED_EMAIL_KEY, LEGACY_REMEMBERED_EMAIL_KEY]);
        }
      } catch {
        // non-fatal
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be available soon.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your Ufazien account</Text>
          </View>

          {/* Form */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Ionicons name="mail-outline" size={18} color={c.textTertiary} />}
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={c.textTertiary} />}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={c.textTertiary}
                />
              </TouchableOpacity>
            }
            error={errors.password}
          />

          <View style={styles.optionsRow}>
            <View style={styles.rememberMe}>
              <Checkbox checked={rememberMe} onPress={() => setRememberMe(!rememberMe)} />
              <Text style={styles.rememberText}>Remember me</Text>
            </View>
            <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legalText}>
            By signing in, you agree to our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://ufazien.com/terms')}
            >
              Terms of Service
            </Text>
            {' and '}
            <Text
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://ufazien.com/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    headerSection: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: c.textSecondary,
      lineHeight: 21,
    },
    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
    },
    rememberMe: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rememberText: {
      fontSize: 13,
      color: c.textSecondary,
    },
    forgotText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    submitButton: {
      marginTop: 20,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 28,
    },
    footerText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      color: c.primary,
      fontWeight: '600',
    },
    legalText: {
      fontSize: 12,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: 24,
      lineHeight: 18,
      paddingHorizontal: 12,
    },
    legalLink: {
      color: c.primary,
      fontWeight: '500',
    },
  });
