import React from 'react';
import { TextInput as RNTextInput, View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const TextInput = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType = 'default', style }) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: colors.primaryText,
    fontSize: theme.fontSizes.medium,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    color: colors.primaryText,
    fontSize: theme.fontSizes.medium,
    borderWidth: 1,
    borderColor: colors.secondaryBackground,
  },
});

export default TextInput;
