import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, RadiusFull } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RadiusFull,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: Colors.light.subtle,
  },
  badge_primary: {
    backgroundColor: '#E8EDFB',
  },
  badge_success: {
    backgroundColor: '#D1FAE5',
  },
  badge_error: {
    backgroundColor: '#FEE2E2',
  },
  badge_warning: {
    backgroundColor: '#FEF3C7',
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
    color: Colors.light.text,
  },
  text_primary: {
    color: '#1A56DB',
  },
  text_success: {
    color: '#065F46',
  },
  text_error: {
    color: '#991B1B',
  },
  text_warning: {
    color: '#92400E',
  },
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 12,
  },
});
