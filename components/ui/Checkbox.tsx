import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '@/constants/theme';
import { useThemedColors } from '@/contexts/ThemeContext';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress, label }) => {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
    },
    checkboxChecked: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    label: {
      fontSize: 14,
      color: c.textSecondary,
      marginLeft: 8,
    },
  });
