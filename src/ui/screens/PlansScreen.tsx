import React, { useState } from 'react';
import { DayPlanEditor, planId } from '../plans/DayPlanEditor';
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
 const [selectedId, setSelectedId] = useState<string>();
 const plan = app.dayPlans.find(p => p.id === selectedId);
 return <SurfaceFrame><ScrollView contentContainerStyle={ed.scroll}>
   <Text accessibilityRole="header" style={ed.title}>Plannen</Text><Text style={ed.body}>Bewaar wat je aanspreekt. Kies later wanneer je gaat.</Text><ResumeExperience />
   {!!app.plansError && <View style={ed.section}><Text accessibilityRole="alert" style={ed.small}>{app.plansError}</Text>{app.canEditPlans && <EditorialAction title="Dagplannen opnieuw opslaan" onPress={app.retryPlans} />}</View>}
   {plan ? <DayPlanEditor key={plan.id} plan={plan} onClose={() => setSelectedId(undefined)} /> : <>
   {!app.savedHydrated ? <Text style={ed.small}>Je ideeën laden…</Text> : !app.savedExperiences.length && <Text style={ed.body}>{app.savedError ? 'Je bewaarlijst is nu niet beschikbaar.' : 'Nog geen ideeën bewaard. Via Bewaar op Nu komt je eerste ervaring hier terecht.'}</Text>}
   {!!app.savedError && <><Text accessibilityRole="alert" style={ed.small}>{app.savedError}</Text>{app.canSave && <EditorialAction title="Opnieuw opslaan" onPress={app.retrySaved} />}</>}
   {app.savedExperiences.map(item => <View key={item.id} style={ed.section}>
     <Text accessibilityRole="header" style={ed.heading}>{item.experience.title}</Text><Text style={ed.body}>{item.experience.promise}</Text>
     <OpenExperience experience={item.experience} /><SaveExperience experience={item.experience} />
   </View>)}
   <View style={ed.section}>
     {!app.plansHydrated && <Text style={ed.small}>Dagplannen laden…</Text>}
     <EditorialAction title="Maak een dagplan" disabled={!app.canEditPlans} onPress={() => { const id = planId(); app.changeDayPlans({ type: 'create', id }); setSelectedId(id); }} />
     {app.dayPlans.length > 0 && <EditorialDisclosure title={`Mijn dagplannen (${app.dayPlans.length})`}>
       {app.dayPlans.map(p => <EditorialAction key={p.id} title={`${p.title} · ${p.items.length} ervaringen`} onPress={() => setSelectedId(p.id)} />)}
     </EditorialDisclosure>}
   </View>
   <EditorialDisclosure title="Suggesties voor vandaag"><Text style={ed.small}>De bestaande dagvoorstellen zijn suggesties, geen afspraken of opgeslagen plannen.</Text>
     <EditorialAction title="Bekijk dagvoorstellen" onPress={() => nav.navigate('Today')} />
   </EditorialDisclosure>
   </>}
 </ScrollView></SurfaceFrame>;
}
