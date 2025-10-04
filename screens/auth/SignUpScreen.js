import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { useAuth } from '../../auth/AuthProvider';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const SignUpScreen = ({ navigation }) => {
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async () => {
    if (!email || !password || password !== confirmPassword || submitting) return;
    try {
      setError(null);
      setSubmitting(true);
  await signUp(email, password, { display_name: displayName });
  // Let AppNavigator switch stacks automatically when user becomes authenticated.
    } catch (e) {
      setError(e.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Authenticated UI switch handled by AppNavigator; no manual navigation needed.

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="cafe" size={50} color={colors.accentGreen} />
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Join the community!</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Display Name"
            placeholder="Display name"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
            <TextInput
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            title={submitting ? 'Creating...' : 'Create Account'}
            onPress={handleSignUp}
            variant="primary"
            style={styles.signUpButton}
            disabled={!email || !password || password !== confirmPassword || submitting}
          />
          {error && (
            <Text style={{ color: colors.error || '#ff5555', marginBottom: theme.spacing.md }}>{error}</Text>
          )}

          {/* Additional social auth buttons could be added here later */}

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Log In</Text>
            </Text>
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
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes.xxlarge,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.large,
    color: colors.secondaryText,
    marginTop: theme.spacing.sm,
  },
  form: {
    flex: 1,
  },
  signUpButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondaryBackground,
  },
  dividerText: {
    color: colors.secondaryText,
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.medium,
  },
  socialButton: {
    marginBottom: theme.spacing.md,
  },
  loginText: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.medium,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  loginLink: {
    color: colors.accentGreen,
    fontWeight: '600',
  },
});

export default SignUpScreen;
