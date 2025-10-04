import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const Button = ({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryBackground : colors.accentGreen} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'secondary' && styles.secondaryButtonText,
            variant === 'outline' && styles.outlineButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.accentGreen,
  },
  secondaryButton: {
    backgroundColor: colors.secondaryBackground,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accentGreen,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: theme.fontSizes.large,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: colors.primaryBackground,
  },
  secondaryButtonText: {
    color: colors.primaryText,
  },
  outlineButtonText: {
    color: colors.accentGreen,
  },
});

export default Button;
