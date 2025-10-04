import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/main/OnboardingScreen';
import MapScreen from '../screens/main/MapScreen';
import CafeDetailScreen from '../screens/main/CafeDetailScreen';
import CheckInFormScreen from '../screens/main/CheckInFormScreen';
import AuthNavigator from './AuthNavigator';
import { useAuth } from '../auth/AuthProvider';
import CommunityScreen from '../screens/main/CommunityScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Could render a splash/loading indicator
  }

  const isAuthed = !!user;

  return (
    <Stack.Navigator
      initialRouteName={isAuthed ? 'Map' : 'Onboarding'}
      screenOptions={{ headerShown: false }}
    >
      {!isAuthed && (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
      {isAuthed && (
        <>
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="CafeDetail" component={CafeDetailScreen} />
          <Stack.Screen name="CheckInForm" component={CheckInFormScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
