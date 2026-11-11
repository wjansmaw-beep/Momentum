import React, { useState } from 'react';
import { AccessibilityInfo, Text, TextInput, View } from 'react-native';
import { useApp } from '../../app/store';
import { colors, useAppearance } from '../../design/theme';
import type { DayPlan } from '../../product/dayPlans';
import { ed, EditorialAction, EditorialDisclosure, OpenExperience } from '../editorial';

let serial = 0;
export const planId = () => `plan-${Date.now().toString(36)}-${(++serial).toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function DayPlanEditor({ plan, onClose }: { plan: DayPlan; onClose: () => void }) {
  const app = useApp(); useAppearance();
  const [title, setTitle] = useState(plan.title);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const announce = (text: string) => { setMessage(text); AccessibilityInfo.announceForAccessibility(text); };
  return <View style={{ gap: 20 }}>
    <EditorialAction title="Terug naar bewaarde ideeën" onPress={onClose} />
    <Text accessibilityRole="header" style={ed.heading}>{plan.title}</Text>
    <Text style={ed.small}>Jouw volgorde, op jouw tempo. Geen vaste tijden of gecontroleerde reisplanning.</Text>
    <EditorialDisclosure title="Naam wijzigen">
      <TextInput accessibilityLabel="Naam van het dagplan" value={title} onChangeText={setTitle} maxLength={100}
        style={[ed.body, { minHeight: 52, borderBottomWidth: 1, borderColor: colors.line, padding: 8 }]}
        placeholder="Mijn dagplan" placeholderTextColor={colors.muted} />
      <EditorialAction title="Naam bewaren" disabled={!app.canEditPlans || !title.trim()} onPress={() => { app.changeDayPlans({ type: 'rename', id: plan.id, title }); announce('Naam gewijzigd.'); }} />
    </EditorialDisclosure>
    {!plan.items.length && <Text style={ed.body}>Kies hieronder je eerste bewaarde ervaring.</Text>}
    {plan.items.map((item, index) => <View key={item.id} style={ed.section}>
      <Text accessibilityRole="header" style={ed.heading}>{index + 1}. {item.experience.title}</Text>
      <Text style={ed.body}>{item.experience.promise}</Text>
      <Text style={ed.small}>{item.experience.duration} minuten ervaring · exclusief reistijd en pauzes</Text>
      <EditorialDisclosure title={`Bekijk ${item.experience.title}`}>
        <OpenExperience experience={item.experience} />
        <EditorialAction title="Omhoog" disabled={!app.canEditPlans || index === 0} onPress={() => { app.changeDayPlans({ type: 'move', id: plan.id, itemId: item.id, direction: -1 }); announce(`${item.experience.title}, positie ${index} van ${plan.items.length}.`); }} />
        <EditorialAction title="Omlaag" disabled={!app.canEditPlans || index === plan.items.length - 1} onPress={() => { app.changeDayPlans({ type: 'move', id: plan.id, itemId: item.id, direction: 1 }); announce(`${item.experience.title}, positie ${index + 2} van ${plan.items.length}.`); }} />
        <EditorialAction title="Verwijder uit dit plan" disabled={!app.canEditPlans} onPress={() => { app.changeDayPlans({ type: 'remove', id: plan.id, itemId: item.id }); announce('Uit dit plan verwijderd. Je bewaarde ideeën blijven behouden.'); }} />
      </EditorialDisclosure>
    </View>)}
    <EditorialDisclosure title="Voeg ervaring toe">
      {!app.savedHydrated ? <Text style={ed.small}>Je ideeën laden…</Text> : app.savedError ? <Text style={ed.small}>{app.savedError}</Text> : !app.savedExperiences.length ? <Text style={ed.body}>Bewaar eerst een ervaring op Nu. Je dagplan blijft hier bewaard.</Text> : null}
      {app.savedExperiences.map(saved => {
        const included = plan.items.some(i => i.experience.id === saved.id);
        return <EditorialAction key={saved.id} title={`${saved.experience.title}${included ? ' · toegevoegd' : ''}`} disabled={!app.canEditPlans || included} onPress={() => {
          app.changeDayPlans({ type: 'add', id: plan.id, itemId: planId(), experience: saved.experience }); announce(`${saved.experience.title} toegevoegd.`);
        }} />;
      })}
    </EditorialDisclosure>
    {!!message && <Text accessibilityLiveRegion="polite" style={ed.small}>{message}</Text>}
    <EditorialDisclosure title="Plan beheren">
      <EditorialAction title="Verwijder dit dagplan" disabled={!app.canEditPlans} onPress={() => setDeleting(true)} />
      {deleting && <View style={{ gap: 12 }}><Text style={ed.body}>Dit dagplan verwijderen? Je bewaarde ideeën, herinneringen en actieve ervaring blijven behouden.</Text>
        <EditorialAction title="Behoud dit plan" onPress={() => setDeleting(false)} />
        <EditorialAction title="Ja, verwijder het plan" onPress={() => { app.changeDayPlans({ type: 'delete', id: plan.id }); onClose(); }} />
      </View>}
    </EditorialDisclosure>
  </View>;
}
