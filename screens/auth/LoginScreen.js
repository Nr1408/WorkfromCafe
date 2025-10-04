import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { useAuth } from '../../auth/AuthProvider';
import colors from '../../constants/colors';
import theme from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email || !password || loadingSubmit) return;
    try {
      setError(null);
      setLoadingSubmit(true);
  await signIn(email, password);
  // Do not manually reset; AppNavigator will re-render with Map once session/user updates.
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // When user becomes authenticated, AppNavigator will swap stacks automatically; no manual reset here.

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
            autoCapitalize="none"
          />
          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
          <Button
            title={loadingSubmit ? 'Logging in...' : 'Log In'}
            onPress={handleLogin}
            variant="primary"
            style={styles.loginButton}
            disabled={!email || !password || loadingSubmit}
          />
          {error && (
            <Text style={{ color: colors.error || '#ff5555', marginBottom: theme.spacing.md }}>{error}</Text>
          )}

          {/* Additional actions could go here (forgot password, socials) */}

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
