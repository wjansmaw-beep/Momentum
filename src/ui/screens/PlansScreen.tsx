import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../app/store';
import { useAppearance } from '../../design/theme';
import { SurfaceFrame } from '../frames';
import { ed, EditorialAction, EditorialDisclosure, OpenExperience, ResumeExperience, SaveExperience } from '../editorial';
import type { RootStackParamList } from '../navigation/types';

export function PlansScreen() {
 const app = useApp(); useAppearance(); const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
 return <SurfaceFrame><ScrollView contentContainerStyle={ed.scroll}>
   <Text accessibilityRole="header" style={ed.title}>Plannen</Text><Text style={ed.body}>Bewaar wat je aanspreekt. Kies later wanneer je gaat.</Text><ResumeExperience />
   {!app.savedHydrated ? <Text style={ed.small}>Je ideeën laden…</Text> : !app.savedExperiences.length && <Text style={ed.body}>{app.savedError ? 'Je bewaarlijst is nu niet beschikbaar.' : 'Nog geen ideeën bewaard. Via Bewaar op Nu komt je eerste ervaring hier terecht.'}</Text>}
   {!!app.savedError && <><Text accessibilityRole="alert" style={ed.small}>{app.savedError}</Text>{app.canSave && <EditorialAction title="Opnieuw opslaan" onPress={app.retrySaved} />}</>}
   {app.savedExperiences.map(item => <View key={item.id} style={ed.section}>
     <Text accessibilityRole="header" style={ed.heading}>{item.experience.title}</Text><Text style={ed.body}>{item.experience.promise}</Text>
     <OpenExperience experience={item.experience} /><SaveExperience experience={item.experience} />
   </View>)}
   <EditorialDisclosure title="Suggesties voor vandaag"><Text style={ed.small}>De bestaande dagvoorstellen zijn suggesties, geen afspraken of opgeslagen plannen.</Text>
     <EditorialAction title="Bekijk dagvoorstellen" onPress={() => nav.navigate('Today')} />
   </EditorialDisclosure>
 </ScrollView></SurfaceFrame>;
}
