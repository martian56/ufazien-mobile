import React, { ReactNode, useMemo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { RadiusMedium, ThemeColors } from '@/constants/theme';
import { useThemedColors } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={c.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    inputWrapper: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: RadiusMedium,
      backgroundColor: c.inputBackground,
    },
    inputWrapperFocused: {
      borderColor: c.primary,
      backgroundColor: c.inputBackgroundFocused,
    },
    inputWrapperError: {
      borderColor: c.error,
    },
    input: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 15,
      color: c.text,
    },
    inputWithLeftIcon: {
      paddingLeft: 42,
    },
    inputWithRightIcon: {
      paddingRight: 42,
    },
    leftIcon: {
      position: 'absolute',
      left: 14,
      zIndex: 1,
    },
    rightIcon: {
      position: 'absolute',
      right: 14,
      zIndex: 1,
    },
    errorText: {
      fontSize: 12,
      color: c.error,
      marginTop: 4,
    },
  });
