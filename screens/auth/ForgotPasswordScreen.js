import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';
import colors from '../../constants/colors';
import theme from '../../constants/theme';
import { useAuth } from '../../auth/AuthProvider';

const ForgotPasswordScreen = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!email || submitting) return;
    try {
      setError(null);
      setMessage(null);
      setSubmitting(true);
      await resetPassword(email);
      setMessage('If that email exists, a password reset link has been sent. Check your inbox.');
    } catch (e) {
      setError(e.message || 'Failed to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="key" size={52} color={colors.accentGreen} />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your account email and we'll send a reset link.</Text>
        </View>
        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button
            title={submitting ? 'Sending...' : 'Send Reset Link'}
            onPress={handleSubmit}
            disabled={!email || submitting}
            variant="primary"
            style={{ marginTop: theme.spacing.md }}
          />
          {message && <Text style={styles.success}>{message}</Text>}
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={{ marginTop: theme.spacing.lg }} onPress={() => navigation.goBack()}>
            <Text style={styles.backToLogin}>Back to Log In</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xxlarge,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSizes.medium,
    paddingHorizontal: theme.spacing.lg,
  },
  form: {
    flex: 1,
  },
  success: {
    color: colors.accentGreen,
    marginTop: theme.spacing.md,
  },
  error: {
    color: colors.error || '#ff4d4d',
    marginTop: theme.spacing.md,
  },
  backToLogin: {
    color: colors.accentGreen,
    fontSize: theme.fontSizes.medium,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
