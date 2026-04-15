import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, RadiusMedium, RadiusLarge, ShadowLight } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  radius = 'md',
  shadow = true,
}) => {
  return (
    <View
      style={[
        styles.card,
        styles[`padding_${padding}`],
        styles[`radius_${radius}`],
        shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  padding_sm: {
    padding: 12,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },
  radius_sm: {
    borderRadius: RadiusMedium,
  },
  radius_md: {
    borderRadius: RadiusMedium,
  },
  radius_lg: {
    borderRadius: RadiusLarge,
  },
  shadow: {
    ...ShadowLight,
  },
});
