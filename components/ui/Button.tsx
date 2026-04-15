import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, PrimaryBlue, RadiusMedium } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[`button_${size}`],
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    variant === 'ghost' && styles.buttonGhost,
    disabled && styles.buttonDisabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${size}`],
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
    disabled && styles.textDisabled,
  ].filter(Boolean) as TextStyle[];

  const spinnerColor = variant === 'outline' || variant === 'ghost' ? PrimaryBlue : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyle}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={textStyle} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RadiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  button_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  button_lg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 50,
  },
  buttonPrimary: {
    backgroundColor: PrimaryBlue,
  },
  buttonSecondary: {
    backgroundColor: Colors.light.subtle,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 16,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: Colors.light.text,
  },
  textOutline: {
    color: Colors.light.text,
  },
  textGhost: {
    color: PrimaryBlue,
  },
  textDisabled: {
    opacity: 0.6,
  },
});
