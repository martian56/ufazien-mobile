import React from 'react';
import { Switch as RNSwitch, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PrimaryBlue, TextPrimary, TextSecondary, BorderDefault } from '@/constants/theme';

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
        trackColor={{ false: BorderDefault, true: PrimaryBlue }}
        thumbColor={'#FFFFFF'}
        ios_backgroundColor={BorderDefault}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: TextPrimary,
    marginBottom: 2,
  },
  labelDisabled: {
    opacity: 0.5,
  },
  description: {
    fontSize: 13,
    color: TextSecondary,
    lineHeight: 18,
  },
  descriptionDisabled: {
    opacity: 0.5,
  },
});
