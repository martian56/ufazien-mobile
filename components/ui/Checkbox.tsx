import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderDefault, TextSecondary, PrimaryBlue } from '@/constants/theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress, label }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: BorderDefault,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: PrimaryBlue,
    borderColor: PrimaryBlue,
  },
  label: {
    fontSize: 14,
    color: TextSecondary,
    marginLeft: 8,
  },
});
