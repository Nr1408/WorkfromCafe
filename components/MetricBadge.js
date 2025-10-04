import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import theme from '../constants/theme';

const MetricBadge = ({ icon, label, value, rating }) => {
  const getColor = () => {
    if (rating === 'Excellent' || rating === 'Good' || rating === 'Quiet' || rating === 'Empty') {
      return colors.accentGreen;
    } else if (rating === 'Fair' || rating === 'Moderate') {
      return colors.warningYellow;
    } else if (rating === 'Poor' || rating === 'Loud' || rating === 'Busy') {
      return colors.dangerRed;
    }
    return colors.secondaryText;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
        <Ionicons name={icon} size={24} color={getColor()} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: getColor() }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.xs,
  },
  value: {
    fontSize: theme.fontSizes.medium,
    fontWeight: '600',
  },
});

export default MetricBadge;
