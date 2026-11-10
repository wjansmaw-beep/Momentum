import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppearance } from '../../design/theme';
import { setAppearancePreference, useAppearancePreference, useAppearanceSaveError, type AppearancePreference } from '../../design/appearancePreference';
import { SurfaceFrame } from '../frames';
import { ed, EditorialAction, EditorialDisclosure, ResumeExperience } from '../editorial';
import type { RootStackParamList } from '../navigation/types';

export function MinimalProfileScreen() {
 useAppearance(); const preference = useAppearancePreference(); const error = useAppearanceSaveError();
 const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 return <SurfaceFrame><ScrollView contentContainerStyle={ed.scroll}><Text accessibilityRole="header" style={ed.title}>Jij</Text>
  <Text style={ed.body}>Jouw voorkeuren. Op jouw manier.</Text><ResumeExperience />
  <EditorialDisclosure title="Weergave">
    {([['system','Volg het systeem'],['light','Light'],['dark','Dark'],['editorial','Editorial']] as [AppearancePreference,string][]).map(([value,label]) =>
      <EditorialAction key={value} title={label} selected={value === preference} onPress={() => setAppearancePreference(value)} />)}
    <Text style={ed.small}>Systeem wisselt tussen Light en Dark. Editorial kies je zelf.</Text>
    {!!error && <Text accessibilityRole="alert" style={ed.small}>{error}</Text>}
  </EditorialDisclosure>
  <EditorialDisclosure title="Interesses, voorkeuren en inzichten"><Text style={ed.body}>Bekijk en wijzig wat Momentum van je weet. Je bestaande inzichten en instellingen blijven beschikbaar.</Text>
    <EditorialAction title="Open mijn voorkeuren en inzichten" onPress={() => nav.navigate('ProfileDetails')} />
  </EditorialDisclosure>
 </ScrollView></SurfaceFrame>;
}
