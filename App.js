import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import colors from './constants/colors';
import { AuthProvider } from './auth/AuthProvider';
import RootErrorBoundary from './components/RootErrorBoundary';

export default function App() {
  return (
    <RootErrorBoundary>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={colors.primaryBackground} />
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </RootErrorBoundary>
  );
}
