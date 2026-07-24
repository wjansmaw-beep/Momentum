import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackActions, useNavigation, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palettes, schemeStyles } from '../design/theme';
import { impactLight } from '../design/haptics';
import { RootStackParamList, routeTabs, TabId, tabRoutes } from './navigation/types';

// Tabbalk volgens concept v2 (ADR-067, fase R1): vijf tabs — NU · DAG · GIDS ·
// BOEK · JIJ — persistent onderin, donker met een verloop dat de content eronder
// laat doorlopen. Eigen lijn-iconen (Ionicons outline, de bestaande iconenset
// van het project), de actieve tab met accent-dot. Een tabdruk vervangt het
// surfacescherm via StackActions.replace — zelfde rustige gedrag als de
// vroegere bottomNav: geen push-historie, Android-back verlaat de app.

type TabSpec = { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap };

const TABS: TabSpec[] = [
  { id: 'nu', label: 'NU', icon: 'disc-outline' },
  { id: 'dag', label: 'DAG', icon: 'calendar-outline' },
  { id: 'gids', label: 'GIDS', icon: 'compass-outline' },
  { id: 'boek', label: 'BOEK', icon: 'book-outline' },
  { id: 'jij', label: 'JIJ', icon: 'person-outline' },
];

type TabBarStyles = {
  gradientColors: [string, string];
  wrap: ViewStyle;
  row: ViewStyle;
  tab: ViewStyle;
  label: TextStyle;
  labelActive: TextStyle;
  activeColor: string;
  inactiveColor: string;
  dot: ViewStyle;
  dotActive: ViewStyle;
};

export function NowTabBar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeRoute = useNavigationState((state) => state.routes[state.index]?.name);
  const activeTab = routeTabs[activeRoute as keyof RootStackParamList];
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <LinearGradient pointerEvents="none" colors={styles.gradientColors} locations={[0, 0.46]} style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => { impactLight(); if (!active) navigation.dispatch(StackActions.replace(tabRoutes[tab.id])); }}
              style={styles.tab}
            >
              <Ionicons name={tab.icon} size={20} color={active ? styles.activeColor : styles.inactiveColor} />
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
              <View style={[styles.dot, active && styles.dotActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Donker podium is de primaire toon (ADR-067 §4): het verloop loopt naar het
// near-black van het concept (#0b0d13-familie). De lichte sibling volgt de
// bestaande dagpalet-tokens (ADR-064). Detectie via palet-identiteit: het
// schemeStyles-mechanisme bouwt dit object twee keer met het ruwe palet.
const styles = schemeStyles(({ colors }): TabBarStyles => {
  const evening = colors === palettes.dark.colors;
  return {
    gradientColors: evening
      ? ['rgba(11,13,19,0)', 'rgba(11,13,19,0.94)']
      : ['rgba(247,246,250,0)', 'rgba(247,246,250,0.94)'],
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 34,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === 'web' ? 14 : 18,
      paddingTop: 12,
    },
    tab: {
      alignItems: 'center',
      gap: 4,
      minWidth: 48,
      minHeight: 44,
      justifyContent: 'center',
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    },
    label: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.7,
      color: evening ? 'rgba(245,244,240,0.55)' : 'rgba(34,37,45,0.55)',
    },
    labelActive: { color: evening ? '#F5F4F0' : colors.bone },
    activeColor: evening ? '#F5F4F0' : colors.bone,
    inactiveColor: evening ? 'rgba(245,244,240,0.45)' : 'rgba(34,37,45,0.45)',
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
    dotActive: { backgroundColor: evening ? '#34C772' : colors.accent },
  };
});
