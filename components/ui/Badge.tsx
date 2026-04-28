import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { RadiusFull, ThemeColors } from '@/constants/theme';
import { useThemedColors } from '@/contexts/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    badge: {
      borderRadius: RadiusFull,
      alignSelf: 'flex-start',
    },
    badge_default: {
      backgroundColor: c.subtle,
    },
    badge_primary: {
      backgroundColor: c.primaryTint,
    },
    badge_success: {
      backgroundColor: c.successTint,
    },
    badge_error: {
      backgroundColor: c.errorTint,
    },
    badge_warning: {
      backgroundColor: c.warningTint,
    },
    badge_sm: {
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badge_md: {
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    text: {
      fontWeight: '600',
    },
    text_default: {
      color: c.text,
    },
    text_primary: {
      color: c.primaryTintText,
    },
    text_success: {
      color: c.successTintText,
    },
    text_error: {
      color: c.errorTintText,
    },
    text_warning: {
      color: c.warningTintText,
    },
    text_sm: {
      fontSize: 11,
    },
    text_md: {
      fontSize: 12,
    },
  });
