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

// Navigatie-fundering (ADR-058): één native-stack als enige navigatiemechanisme.
// ADR-067 (fase R1): het skelet is vijf tabs — NU · DAG · GIDS · BOEK · JIJ —
// waarvan de tabbalk (ui/NowTabBar) via replace zonder animatie wisselt.
// - Guide is de GIDS-tab én het onderweg-scherm in één: de samengevoegde
//   opvolger van het oude Presence-scherm, de gids-sheet en de hervatkaart.
// - Profiel (JIJ) is geen modal meer maar een surface in het skelet.
// - Ontdekken is opgeruimd: R2 (Dag) neemt ontdekking op in de redactionele
//   daglijn; er is geen Discover-scherm of -route meer.
// - Flow-stages (Prepare→Guide→Remember) zijn push met platform-standaard
//   transities en Android-back via de navigator.
// - Onboarding en de uitnodigingsschermen zijn eerste-run-schermen op de stack.
// - Guide en Remember hebben de swipe-pop uit: hun beforeRemove-logica (gids
//   terug naar Voorpret, reflectietelling) moet altijd lopen.

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { personalHydrated, displayFontsLoaded, personalProfile, incomingInvite, inviteIssue, inviteGuestMode } = useApp();
  // ADR-064: the navigator chrome follows the device appearance; the token
  // reads inside the memo resolve through the scheme-aware proxy.
  const scheme = useAppearance();
  const navigationTheme = useMemo<Theme>(() => ({
    ...DefaultTheme,
    dark: scheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.backdrop,
      card: colors.backdrop,
      text: colors.bone,
      border: 'transparent',
    },
  }), [scheme]);

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
        <Stack.Screen name="Guide" component={GuideScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="LifeBook" component={LifeBookScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'none' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="IncomingInvite" component={IncomingInviteScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="InvalidInvite" component={InvalidInviteScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Prepare" component={PrepareScreen} />
        <Stack.Screen name="Remember" component={RememberScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
