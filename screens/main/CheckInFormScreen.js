import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import colors from '../../constants/colors';
import theme from '../../constants/theme';
import SpeedTest from '../../components/SpeedTest';
import { submitCheckIn } from '../../services/checkIns';

const SegmentedControl = ({ options, selected, onSelect, label }) => (
  <View style={styles.segmentedContainer}>
    <Text style={styles.segmentedLabel}>{label}</Text>
    <View style={styles.segmentedControl}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.segmentedButton,
            selected === option && styles.segmentedButtonActive,
          ]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.segmentedButtonText,
              selected === option && styles.segmentedButtonTextActive,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const CheckInFormScreen = ({ route, navigation }) => {
  const { cafe, onCheckInSuccess } = route.params;
  const [crowdLevel, setCrowdLevel] = useState('');
  const [powerOutlets, setPowerOutlets] = useState('');
  const [noiseLevel, setNoiseLevel] = useState('');
  const [wifiSpeed, setWifiSpeed] = useState(''); // from SpeedTest
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isFormValid = crowdLevel && powerOutlets && noiseLevel && wifiSpeed; // wifiSpeed comes only from test

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    try {
      setSubmitError(null);
      setSubmitting(true);
      await submitCheckIn({
        placeId: cafe.id, // Google Places id
        crowdLevel,
        wifiSpeed: Number(wifiSpeed),
        powerOutlets,
        noiseLevel,
      });
      if (onCheckInSuccess) {
        onCheckInSuccess({
          place_id: cafe.id,
          crowd_level: crowdLevel,
          wifi_speed: Number(wifiSpeed),
          power_outlets: powerOutlets,
          noise_level: noiseLevel,
          created_at: new Date().toISOString(),
        });
      }
      navigation.goBack();
    } catch (e) {
      setSubmitError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Live Update</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.cafeName}>{cafe.name}</Text>
        <Text style={styles.description}>
          Help the community by sharing current conditions at this cafe
        </Text>

        <Card>
          <SegmentedControl
            label="Crowd Level"
            options={['Empty', 'Moderate', 'Busy']}
            selected={crowdLevel}
            onSelect={setCrowdLevel}
          />
        </Card>

        <Card>
          <SegmentedControl
            label="Power Outlet Availability"
            options={['Excellent', 'Good', 'Fair', 'Poor']}
            selected={powerOutlets}
            onSelect={setPowerOutlets}
          />
        </Card>

        <Card>
          <SegmentedControl
            label="Noise Level"
            options={['Quiet', 'Moderate', 'Loud']}
            selected={noiseLevel}
            onSelect={setNoiseLevel}
          />
        </Card>

        <Card>
          <Text style={styles.segmentedLabel}>Wi-Fi Speed (Mbps)</Text>
          {wifiSpeed ? (
            <Text style={{ color: colors.accentGreen, fontWeight: '600', marginBottom: theme.spacing.sm }}>
              {wifiSpeed} Mbps
            </Text>
          ) : (
            <Text style={{ color: colors.secondaryText, marginBottom: theme.spacing.sm }}>
              Run the test to capture speed
            </Text>
          )}
          <SpeedTest
            onComplete={({ downloadMbps }) => {
              if (downloadMbps) {
                setWifiSpeed(downloadMbps.toString());
              }
            }}
          />
        </Card>

        <Button
          title={submitting ? 'Submitting...' : 'Submit Update'}
          onPress={handleSubmit}
          variant="primary"
          disabled={!isFormValid || submitting}
          style={styles.submitButton}
        />
        {submitError ? (
          <Text style={{ color: colors.error || '#ff5555', marginTop: theme.spacing.sm }}>
            {submitError}
          </Text>
        ) : null}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryBackground,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSizes.xlarge,
    fontWeight: '600',
    color: colors.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  cafeName: {
    fontSize: theme.fontSizes.xxlarge,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSizes.medium,
    color: colors.secondaryText,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  segmentedContainer: {
    marginBottom: theme.spacing.sm,
  },
  segmentedLabel: {
    fontSize: theme.fontSizes.medium,
    color: colors.primaryText,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  segmentedButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: colors.primaryBackground,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondaryText,
  },
  segmentedButtonActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  segmentedButtonText: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.medium,
  },
  segmentedButtonTextActive: {
    color: colors.primaryBackground,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});

export default CheckInFormScreen;
