import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const Card = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});

export default Card;
