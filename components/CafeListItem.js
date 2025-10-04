import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import theme from '../constants/theme';

const CafeListItem = ({ cafe, onPress }) => {
  const getMetricColor = (value, type) => {
    if (type === 'wifi') {
      if (value >= 50) return colors.accentGreen;
      if (value >= 25) return colors.warningYellow;
      return colors.dangerRed;
    }
    if (type === 'crowd') {
      if (value === 'Empty') return colors.accentGreen;
      if (value === 'Moderate') return colors.warningYellow;
      return colors.dangerRed;
    }
    return colors.secondaryText;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name}>{cafe.name}</Text>
        <Text style={styles.updateTime}>{cafe.last_live_update_at}</Text>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="wifi" size={16} color={getMetricColor(cafe.current_wifi_speed_mbps, 'wifi')} />
          <Text style={[styles.metricText, { color: getMetricColor(cafe.current_wifi_speed_mbps, 'wifi') }]}>
            Fast: {cafe.current_wifi_speed_mbps} Mbps
          </Text>
        </View>
        
        <View style={styles.metric}>
          <Ionicons name="people" size={16} color={getMetricColor(cafe.current_crowd_level, 'crowd')} />
          <Text style={[styles.metricText, { color: getMetricColor(cafe.current_crowd_level, 'crowd') }]}>
            {cafe.current_crowd_level}
          </Text>
        </View>
      </View>
      
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={14} color={colors.secondaryText} />
        <Text style={styles.address} numberOfLines={1}>{cafe.address}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  name: {
    color: colors.primaryText,
    fontSize: theme.fontSizes.large,
    fontWeight: '600',
    flex: 1,
  },
  updateTime: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.small,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  metricText: {
    fontSize: theme.fontSizes.small,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.small,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
});

export default CafeListItem;
