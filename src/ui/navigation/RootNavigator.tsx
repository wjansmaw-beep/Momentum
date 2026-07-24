import React from 'react';
import { View } from 'react-native';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../design/theme';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { linking } from './linking';
import { RootStackParamList } from './types';
import { NowScreen } from '../screens/NowScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { LifeBookScreen } from '../screens/LifeBookScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { IncomingInviteScreen, InvalidInviteScreen } from '../screens/InviteScreens';
import { PrepareScreen } from '../screens/PrepareScreen';
import { PresenceScreen } from '../screens/PresenceScreen';
import { RememberScreen } from '../screens/RememberScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Navigatie-fundering (ADR-058): één native-stack als enige navigatiemechanisme.
// - De vier surfaces zijn eigen schermen; de bestaande bottomNav wisselt ertussen
//   via replace zonder animatie (zelfde gedrag als de vroegere surface-wissel;
//   zie src/ui/primitives.tsx → BottomNav).
// - Flow-stages (Prepare→Presence→Remember) en Profiel zijn push/modal met
//   platform-standaard transities en Android-back via de navigator.
// - Onboarding en de uitnodigingsschermen zijn eerste-run-schermen op de stack.
// - Presence en Remember hebben de swipe-pop uit: hun beforeRemove-logica
//   (sessie terug naar Prepare, reflectietelling) moet altijd lopen.

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.backdrop,
    card: colors.backdrop,
    text: colors.bone,
    border: 'transparent',
  },
};

export function RootNavigator() {
  const { personalHydrated, displayFontsLoaded, personalProfile, incomingInvite, inviteIssue, inviteGuestMode } = useApp();

  // Laadpoort ongewijzigd: wacht op profiel-hydratatie en de display-serif
  // voordat er een scherm verschijnt.
  if (!personalHydrated || !displayFontsLoaded) return <View style={styles.root} />;

  // Eerste scherm: een uitnodiging in de start-URL gaat voor; daarna de
  // eerste-run-flow (tenzij een uitgenodigde gast zojuist heeft geaccepteerd).
  const initialRouteName: keyof RootStackParamList =
    inviteIssue === 'invalid' ? 'InvalidInvite'
      : incomingInvite ? 'IncomingInvite'
        : !personalProfile.onboardingComplete && !inviteGuestMode ? 'Onboarding'
          : 'Now';

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.backdrop },
        }}
      >
        <Stack.Screen name="Now" component={NowScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Today" component={TodayScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Discover" component={DiscoverScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="LifeBook" component={LifeBookScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="IncomingInvite" component={IncomingInviteScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="InvalidInvite" component={InvalidInviteScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Prepare" component={PrepareScreen} />
        <Stack.Screen name="Presence" component={PresenceScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Remember" component={RememberScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
