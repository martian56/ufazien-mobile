import React, { useMemo } from 'react';
import { Switch as RNSwitch, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors } from '@/constants/theme';
import { useThemedColors } from '@/contexts/ThemeContext';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  style,
}) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={[styles.container, style]}>
      {(label || description) && (
        <View style={styles.textContainer}>
          {label && <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>}
          {description && (
            <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
              {description}
            </Text>
          )}
        </View>
      )}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor={c.border}
      />
    </View>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    textContainer: {
      flex: 1,
      marginRight: 16,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      marginBottom: 2,
    },
    labelDisabled: {
      opacity: 0.5,
    },
    description: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
    },
    descriptionDisabled: {
      opacity: 0.5,
    },
  });
