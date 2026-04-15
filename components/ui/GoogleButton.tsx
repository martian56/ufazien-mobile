import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderDefault, TextPrimary, RadiusMedium, ShadowLight } from '@/constants/theme';

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  title = 'Continue with Google',
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, (loading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={TextPrimary} size="small" />
      ) : (
        <View style={styles.content}>
          <Ionicons name="logo-google" size={18} color="#4285F4" />
          <Text style={styles.text}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BorderDefault,
    borderRadius: RadiusMedium,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...ShadowLight,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: TextPrimary,
  },
});
