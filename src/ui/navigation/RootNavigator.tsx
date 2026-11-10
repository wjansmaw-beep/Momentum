import { useReducedMotion } from '../../design/motion';
import { MinimalNowScreen } from '../screens/MinimalNowScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { MinimalProfileScreen } from '../screens/MinimalProfileScreen';
import { FreshExperienceScreen } from '../screens/FreshExperienceScreen';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, useAppearance } from '../../design/theme';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { linking } from './linking';
import { RootStackParamList } from './types';
import { NowScreen } from '../screens/NowScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { GuideScreen } from '../screens/GuideScreen';
import { LifeBookScreen } from '../screens/LifeBookScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { IncomingInviteScreen, InvalidInviteScreen } from '../screens/InviteScreens';
import { PrepareScreen } from '../screens/PrepareScreen';
import { RememberScreen } from '../screens/RememberScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// ADR-058/071: one native stack. The fresh journey is the default entry.
// Legacy routes remain reachable for existing functions and invitation links.

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const reducedMotion = useReducedMotion();
  const { personalHydrated, displayFontsLoaded, memoriesHydrated, sessionHydrated, incomingInvite, inviteIssue } = useApp();
  // ADR-071: navigator chrome follows the saved light/dark/system choice; token
  // reads inside the memo resolve through the scheme-aware proxy.
  const scheme = useAppearance();
  const navigationTheme = useMemo<Theme>(() => ({
    ...DefaultTheme,
    dark: scheme !== 'light',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.backdrop,
      card: colors.backdrop,
      text: colors.bone,
      border: 'transparent',
    },
  }), [scheme]);

  // Restore profile, memories and session before showing the first screen.
  if (!personalHydrated || !displayFontsLoaded || !memoriesHydrated || !sessionHydrated) return <View style={styles.root} />;

  // Explicit incoming invitations take priority over the fresh home.
  const initialRouteName: keyof RootStackParamList =
    inviteIssue === 'invalid' ? 'InvalidInvite'
      : incomingInvite ? 'IncomingInvite'
        : 'Now';

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: reducedMotion ? 'none' : 'default',
          contentStyle: { backgroundColor: colors.backdrop },
        }}
      >
        {(['FreshHome', 'FreshPreview', 'FreshGuide', 'FreshQuestion', 'FreshFinish', 'FreshBook', 'FreshOptions'] as const).map(name =>
          <Stack.Screen key={name} name={name} component={FreshExperienceScreen} />)}
        <Stack.Screen name="Now" component={MinimalNowScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Plans" component={PlansScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="NowDetails" component={NowScreen} />
        <Stack.Screen name="ProfileDetails" component={ProfileScreen} />
        <Stack.Screen name="Today" component={TodayScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Guide" component={GuideScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="LifeBook" component={LifeBookScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Profile" component={MinimalProfileScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="IncomingInvite" component={IncomingInviteScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="InvalidInvite" component={InvalidInviteScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Prepare" component={PrepareScreen} />
        <Stack.Screen name="Remember" component={RememberScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
