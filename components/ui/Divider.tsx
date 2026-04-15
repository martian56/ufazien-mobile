import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextTertiary, BorderDefault } from '@/constants/theme';

export const Divider: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>or</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: BorderDefault,
  },
  text: {
    fontSize: 13,
    color: TextTertiary,
    marginHorizontal: 14,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
});
