// SafeAreaView Wrapper Component
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackgroundPrimary } from '@/constants/theme';

interface SafeAreaViewProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  edges = ['top', 'bottom'],
}) => {
  const insets = useSafeAreaInsets();

  const paddingStyles: ViewStyle = {};

  if (edges.includes('top')) {
    paddingStyles.paddingTop = insets.top;
  }
  if (edges.includes('bottom')) {
    paddingStyles.paddingBottom = insets.bottom;
  }
  if (edges.includes('left')) {
    paddingStyles.paddingLeft = insets.left;
  }
  if (edges.includes('right')) {
    paddingStyles.paddingRight = insets.right;
  }

  return <View style={[styles.container, paddingStyles, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundPrimary,
  },
});
