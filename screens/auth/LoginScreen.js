import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { useAuth } from '../../auth/AuthProvider';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const { signInWithEmail, user } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSendLink = async () => {
    if (!email || sending) return;
    try {
      setError(null);
      setSending(true);
      await signInWithEmail(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(e.message || 'Failed to send link');
    } finally {
      setSending(false);
    }
  };

  if (user) {
    // If already logged in (magic link returned), go to Map
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="cafe" size={50} color={colors.accentGreen} />
          <Text style={styles.title}>Log in</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          
          {sent ? (
            <Text style={{ color: colors.accentGreen, marginBottom: theme.spacing.md }}>
              Magic link sent. Check your email.
            </Text>
          ) : (
            <Button
              title={sending ? 'Sending...' : 'Send Magic Link'}
              onPress={handleSendLink}
              variant="primary"
              style={styles.loginButton}
              disabled={!email || sending}
            />
          )}
          {error && (
            <Text style={{ color: colors.error || '#ff5555', marginBottom: theme.spacing.md }}>{error}</Text>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Placeholder social buttons retained (non-functional) */}
          <Button
            title="Continue with Google"
            onPress={() => {}}
            variant="secondary"
            style={styles.socialButton}
          />
          <Button
            title="Continue with Apple"
            onPress={() => {}}
            variant="secondary"
          />

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
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
  form: {
    flex: 1,
  },
  forgotPassword: {
    color: colors.infoBlue,
    fontSize: theme.fontSizes.medium,
    textAlign: 'right',
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
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
  signUpText: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.medium,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  signUpLink: {
    color: colors.accentGreen,
    fontWeight: '600',
  },
});

export default LoginScreen;
