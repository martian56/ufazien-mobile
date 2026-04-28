// SafeAreaView Wrapper Component
import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedColors } from '@/contexts/ThemeContext';

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
  const c = useThemedColors();

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

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }, paddingStyles, style]}>
      {children}
    </View>
  );
};
