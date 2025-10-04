import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
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
          <Image
            source={require('../../assets/onboarding-hero.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <Text style={styles.graphicText}>Live, User-Verified Data for Remote Workers</Text>
        </View>

        <Button
          title={user ? 'OPEN MAP' : '📍 Find Cafes Near Me'}
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

        <View style={styles.singleFeatureWrapper}>
          <Card style={styles.singleFeatureCard}>
            <Ionicons name="people-outline" size={28} color={colors.accentGreen} />
            <Text style={styles.singleFeatureTitle}>Community Powered</Text>
            <Text style={styles.singleFeatureDescription}>User-shared insights that keep data fresh & trustworthy.</Text>
          </Card>
        </View>

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
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.large || 24,
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
  singleFeatureWrapper: {
    marginTop: theme.spacing.md,
  },
  singleFeatureCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  singleFeatureTitle: {
    fontSize: theme.fontSizes.medium,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  singleFeatureDescription: {
    fontSize: theme.fontSizes.small,
    color: colors.secondaryText,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  footer: {
    fontSize: theme.fontSizes.small,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

export default OnboardingScreen;
