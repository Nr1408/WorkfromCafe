import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MetricBadge from '../../components/MetricBadge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import colors from '../../constants/colors';
import { useLiveCheckIns } from '../../hooks/useLiveCheckIns';
import theme from '../../constants/theme';

const CafeDetailScreen = ({ route, navigation }) => {
  const { cafe } = route.params;
  const { rows: liveRows } = useLiveCheckIns(Number(cafe.id), 1);
  const latest = liveRows && liveRows.length ? liveRows[0] : null;
  const crowd = latest?.crowd_level || cafe.current_crowd_level;
  const wifi = latest?.wifi_speed != null ? latest.wifi_speed : cafe.current_wifi_speed_mbps;
  const power = latest?.power_outlets || cafe.current_power_outlets_rating;
  const noise = latest?.noise_level || cafe.current_noise_level_rating;
  const lastUpdated = latest ? 'Just now' : cafe.last_live_update_at;

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
          <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>

          <View style={styles.metricsContainer}>
            <MetricBadge
              icon="wifi"
              label="Wi-Fi Speed"
              value={`${wifi} Mbps`}
              rating={wifi >= 50 ? 'Excellent' : wifi >= 25 ? 'Good' : 'Fair'}
            />
            <MetricBadge
              icon="flash"
              label="Power Outlets"
              value={power}
              rating={power}
            />
            <MetricBadge
              icon="volume-medium"
              label="Noise Level"
              value={noise}
              rating={noise}
            />
          </View>

          <View style={styles.metricsContainer}>
            <MetricBadge
              icon="people"
              label="Crowd Level"
              value={crowd}
              rating={crowd}
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
