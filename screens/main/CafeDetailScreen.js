import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MetricBadge from '../../components/MetricBadge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const CafeDetailScreen = ({ route, navigation }) => {
  const { cafe } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{cafe.name}</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Image
          source={{ uri: cafe.cover_image_url }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Live Productivity Metrics</Text>
          <Text style={styles.lastUpdated}>Last Updated: {cafe.last_live_update_at}</Text>

          <View style={styles.metricsContainer}>
            <MetricBadge
              icon="wifi"
              label="Wi-Fi Speed"
              value={`${cafe.current_wifi_speed_mbps} Mbps`}
              rating={cafe.current_wifi_speed_mbps >= 50 ? 'Excellent' : cafe.current_wifi_speed_mbps >= 25 ? 'Good' : 'Fair'}
            />
            <MetricBadge
              icon="flash"
              label="Power Outlets"
              value={cafe.current_power_outlets_rating}
              rating={cafe.current_power_outlets_rating}
            />
            <MetricBadge
              icon="volume-medium"
              label="Noise Level"
              value={cafe.current_noise_level_rating}
              rating={cafe.current_noise_level_rating}
            />
          </View>

          <View style={styles.metricsContainer}>
            <MetricBadge
              icon="people"
              label="Crowd Level"
              value={cafe.current_crowd_level}
              rating={cafe.current_crowd_level}
            />
          </View>

          <Button
            title="Check-In & Update Live Data"
            onPress={() => navigation.navigate('CheckInForm', { cafe })}
            variant="primary"
            style={styles.checkInButton}
          />

          <Card>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.accentGreen} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{cafe.address}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={colors.accentGreen} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Hours</Text>
                <Text style={styles.infoValue}>{cafe.hours_of_operation}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <View style={styles.infoRow}>
              <Ionicons name="globe" size={20} color={colors.accentGreen} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={[styles.infoValue, styles.link]}>Visit website</Text>
              </View>
            </View>
          </Card>

          <Text style={styles.sectionTitle}>Community Tips</Text>
          <Card>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color={colors.warningYellow} />
              <Text style={styles.tipTitle}>Local Insight</Text>
            </View>
            <Text style={styles.tipText}>{cafe.community_tips}</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: colors.primaryBackground,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSizes.xlarge,
    fontWeight: '600',
    color: colors.primaryText,
    marginHorizontal: theme.spacing.md,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.secondaryBackground,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.xlarge,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  lastUpdated: {
    fontSize: theme.fontSizes.small,
    color: colors.secondaryText,
    marginBottom: theme.spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  checkInButton: {
    marginVertical: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSizes.small,
    color: colors.secondaryText,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSizes.medium,
    color: colors.primaryText,
  },
  link: {
    color: colors.infoBlue,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tipTitle: {
    fontSize: theme.fontSizes.large,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: theme.spacing.sm,
  },
  tipText: {
    fontSize: theme.fontSizes.medium,
    color: colors.primaryText,
    lineHeight: 22,
  },
});

export default CafeDetailScreen;
