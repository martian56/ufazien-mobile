import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderDefault,
  RadiusMedium,
  TextPrimary,
  TextSecondary,
  ShadowHeavy,
} from '@/constants/theme';

interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label?: string;
  value: string;
  options: PickerOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select...',
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.picker}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerText, !selectedOption && styles.pickerTextPlaceholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={TextSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={TextSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, value === item.value && styles.optionSelected]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[styles.optionText, value === item.value && styles.optionTextSelected]}
                  >
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.light.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TextSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: BorderDefault,
    borderRadius: RadiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: Colors.light.card,
    minHeight: 44,
  },
  pickerText: {
    fontSize: 15,
    color: TextPrimary,
    flex: 1,
  },
  pickerTextPlaceholder: {
    color: TextSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    ...ShadowHeavy,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TextPrimary,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  optionSelected: {
    backgroundColor: '#E8EDFB',
  },
  optionText: {
    fontSize: 15,
    color: TextPrimary,
  },
  optionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
