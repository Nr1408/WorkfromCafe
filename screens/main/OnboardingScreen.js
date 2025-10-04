import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import { useAuth } from '../../auth/AuthProvider';
import Card from '../../components/common/Card';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const OnboardingScreen = ({ navigation }) => {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="cafe" size={60} color={colors.accentGreen} />
          <Text style={styles.title}>WorkFromCafe</Text>
          <Text style={styles.tagline}>Find Your Focus. Anytime, Anywhere.</Text>
        </View>

        <View style={styles.graphicContainer}>
          <Ionicons name="map" size={120} color={colors.accentGreen} />
          <Text style={styles.graphicText}>Live, User-Verified Data for Remote Workers</Text>
        </View>

        <Button
          title={user ? 'OPEN MAP' : 'GET STARTED'}
          onPress={() => {
            if (user) {
              navigation.navigate('Map');
            } else {
              navigation.navigate('Auth', { screen: 'Login' });
            }
          }}
          variant="primary"
          style={styles.launchButton}
        />

        <View style={styles.featuresContainer}>
          <Card style={styles.featureCard}>
            <Ionicons name="map-outline" size={24} color={colors.accentGreen} />
            <Text style={styles.featureTitle}>Interactive Map</Text>
            <Text style={styles.featureDescription}>Real-time cafe locations</Text>
          </Card>

          <Card style={styles.featureCard}>
            <Ionicons name="speedometer-outline" size={24} color={colors.accentGreen} />
            <Text style={styles.featureTitle}>Verified Speed</Text>
            <Text style={styles.featureDescription}>Live Wi-Fi metrics</Text>
          </Card>

          <Card style={styles.featureCard}>
            <Ionicons name="people-outline" size={24} color={colors.accentGreen} />
            <Text style={styles.featureTitle}>Community Powered</Text>
            <Text style={styles.featureDescription}>User-shared insights</Text>
          </Card>
        </View>

        <Text style={styles.footer}>Seamlessly powered by Next.js & Supabase</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes.title,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: theme.spacing.md,
  },
  tagline: {
    fontSize: theme.fontSizes.large,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  graphicContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  graphicText: {
    fontSize: theme.fontSizes.medium,
    color: colors.secondaryText,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  launchButton: {
    marginVertical: theme.spacing.lg,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: theme.fontSizes.small,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: theme.fontSizes.small,
    color: colors.secondaryText,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  footer: {
    fontSize: theme.fontSizes.small,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

export default OnboardingScreen;
