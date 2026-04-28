import React, { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeColors } from '@/constants/theme';

export default function SignUpScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { signup } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and number';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(email, password, firstName.trim(), lastName.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join Ufazien to track your academic progress</Text>
          </View>

          {/* Name Row */}
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Input
                label="First Name"
                placeholder="First"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                }}
                autoCapitalize="words"
                autoComplete="given-name"
                error={errors.firstName}
                containerStyle={styles.nameInput}
              />
            </View>
            <View style={styles.nameField}>
              <Input
                label="Last Name"
                placeholder="Last"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                }}
                autoCapitalize="words"
                autoComplete="family-name"
                error={errors.lastName}
                containerStyle={styles.nameInput}
              />
            </View>
          </View>

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
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
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

          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={c.textTertiary} />}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={c.textTertiary}
                />
              </TouchableOpacity>
            }
            error={errors.confirmPassword}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
      marginBottom: 28,
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
    nameRow: {
      flexDirection: 'row',
      gap: 12,
    },
    nameField: {
      flex: 1,
    },
    nameInput: {
      marginBottom: 16,
    },
    submitButton: {
      marginTop: 8,
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
  });
