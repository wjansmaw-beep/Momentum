import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useAppearance } from '../design/theme';
import { RootStackParamList, routeTabs, TabId, tabRoutes } from './navigation/types';
const tabs: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
 { id: 'nu', label: 'Nu', icon: 'home-outline' },
 { id: 'plannen', label: 'Plannen', icon: 'bookmark-outline' },
 { id: 'boek', label: 'Boek', icon: 'book-outline' },
 { id: 'jij', label: 'Jij', icon: 'person-outline' },
];
export function NowTabBar() {
 useAppearance(); const inset = useSafeAreaInsets();
 const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 const route = useNavigationState(state => state.routes[state.index]?.name);
 const active = routeTabs[route as keyof RootStackParamList];
 return <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.ink,
  borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, paddingBottom: Math.max(12, inset.bottom), paddingTop: 10, flexDirection: 'row' }}>
  {tabs.map(tab => <Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} aria-selected={active === tab.id} accessibilityState={{ selected: active === tab.id }}
   onPress={() => { if (route !== tabRoutes[tab.id]) nav.dispatch(StackActions.replace(tabRoutes[tab.id])); }}
   style={({ pressed }) => ({ flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 5, opacity: pressed ? .6 : 1 })}>
    <Ionicons name={tab.icon} size={23} color={active === tab.id ? colors.bone : colors.muted} />
    <Text style={{ color: active === tab.id ? colors.bone : colors.muted, fontWeight: active === tab.id ? '700' : '400', fontSize: 13 }}>{tab.label}</Text>
  </Pressable>)}
 </View>;
}
