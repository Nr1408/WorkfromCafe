import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import colors from '../constants/colors';
import theme from '../constants/theme';

export class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.warn('RootErrorBoundary caught error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{this.state.error.message}</Text>
          {this.state.info && (
            <View style={styles.block}>
              <Text selectable style={styles.stack}>{this.state.error.stack}</Text>
            </View>
          )}
          <Text style={styles.hint}>Common causes:
            {'\n'}- Missing or mismatched Expo config (extra values)
            {'\n'}- Version mismatch (React / React Native / Expo SDK)
            {'\n'}- Network issue fetching update/assets
            {'\n'}- Supabase env not set
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.primaryBackground,
    gap: 16,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary
  },
  block: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8
  },
  stack: {
    fontSize: 12,
    color: '#eee',
    fontFamily: 'monospace'
  },
  hint: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18
  }
});

export default RootErrorBoundary;
