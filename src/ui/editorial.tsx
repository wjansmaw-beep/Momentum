import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, schemeStyles, typography, useAppearance } from '../design/theme';
import { useApp } from '../app/store';
import type { Experience } from '../product/experienceModel';
import type { RootStackParamList } from './navigation/types';
import { referenceImages, referenceImageCredit } from '../product/referenceImages';
import { CoverImage } from './CoverImage';

export function EditorialAction({ title, onPress, primary = false, selected, disabled = false }: { title: string; onPress: () => void; primary?: boolean; selected?: boolean; disabled?: boolean }) {
  useAppearance();
  return <Pressable accessibilityRole="button" aria-pressed={selected} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ed.action, primary && { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 18 }, { opacity: disabled ? .45 : pressed ? .7 : 1 }]}>
    <Text style={[ed.actionText, primary && { color: colors.onAccent, textAlign: 'center' }]}>{selected ? '✓  ' : ''}{title}</Text>
  </Pressable>;
}
export function EditorialDisclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={ed.section}><Pressable accessibilityRole="button" aria-expanded={open} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={ed.row}>
    <Text style={[ed.body, { flex: 1 }]}>{title}</Text><Text accessible={false} style={ed.body}>{open ? '−' : '+'}</Text>
  </Pressable>{open && <View style={ed.depth}>{children}</View>}</View>;
}
export function EditorialPhoto({ experience }: { experience: Experience }) {
  const ownCredit = referenceImageCredit(experience.image);
  const credit = ownCredit ?? (['outside', 'restore'].includes(experience.kind) ? referenceImages.lauwersmeer : undefined);
  const [error, setError] = useState('');
  if (!credit) return <Text style={ed.small}>Bij deze ervaring is geen gecontroleerde foto beschikbaar.</Text>;
  return <View style={{ gap: 8 }}>
    <CoverImage uri={credit?.uri} alt={credit ? (ownCredit ? `Foto bij ${experience.title}` : 'Sfeerbeeld van het Lauwersmeer; niet de bestemming van deze ervaring') : 'Geen gecontroleerde foto beschikbaar'} style={ed.hero} imageStyle={{ borderRadius: 0 }} />
    {credit && !ownCredit && <Text style={ed.small}>Sfeerbeeld: Lauwersmeer · geen voorgestelde bestemming</Text>}
    {credit && <EditorialDisclosure title="Foto en herkomst"><Text style={ed.small}>{credit.label} · uitsnede; geen actuele opname</Text>
      <EditorialAction title="Bekijk beeldbron" onPress={() => { Linking.openURL(credit.source).catch(() => setError('De beeldbron is nu niet bereikbaar.')); }} />
      <EditorialAction title="Bekijk licentie" onPress={() => { Linking.openURL(credit.license).catch(() => setError('De licentie is nu niet bereikbaar.')); }} />
      {!!error && <Text accessibilityRole="alert" style={ed.small}>{error}</Text>}
    </EditorialDisclosure>}
  </View>;
}
export function ResumeExperience() {
  const app = useApp();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (!app.activeSession || !app.resumableExperience) return null;
  return <EditorialAction title={`Hervat: ${app.resumableExperience.title}`} onPress={() => {
    const stage = app.resumeSession(); if (stage) nav.navigate(stage === 'presence' ? 'Guide' : 'Prepare');
  }} />;
}
// Opening preparation may persist its state. Require an explicit choice before
// replacing a different active experience, including a restored snapshot.
export function OpenExperience({ experience, family = false, from = 'now' }: { experience: Experience; family?: boolean; from?: 'now' | 'today' | 'lifebook' }) {
  const app = useApp(); const [confirm, setConfirm] = useState(false);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const open = () => { app.openExperience(experience, from, family ? 'family' : undefined); nav.navigate('Prepare'); };
  const same = app.activeSession?.experienceId === experience.id;
  return <View style={{ gap: 12 }}><EditorialAction primary title={same ? 'Hervat deze ervaring' : 'Ontdek deze ervaring'} onPress={() => {
    if (same) { const stage = app.resumeSession(); if (stage) nav.navigate(stage === 'presence' ? 'Guide' : 'Prepare'); }
    else if (app.activeSession) setConfirm(true); else open();
  }} />{confirm && <View style={ed.depth}><Text style={ed.body}>Er staat nog een ervaring open. Wil je die afsluiten en deze voorbereiden?</Text>
    <EditorialAction title="Behoud mijn actieve ervaring" onPress={() => setConfirm(false)} />
    <EditorialAction title="Sluit af en ga verder" onPress={() => { app.discardSession(); setConfirm(false); open(); }} />
  </View>}</View>;
}
export function SaveExperience({ experience }: { experience: Experience }) {
 const app = useApp(); const saved = app.savedExperiences.some(x => x.id === experience.id);
 return <View style={ed.section}><EditorialAction selected={saved} disabled={!app.canSave}
  title={saved ? 'Bewaard · verwijder uit Plannen' : 'Bewaar'} onPress={() => app.toggleSavedExperience(experience)} />
  {!!app.savedError && <><Text accessibilityRole="alert" style={ed.small}>{app.savedError}</Text>{app.canSave && <EditorialAction title="Opnieuw opslaan" onPress={app.retrySaved} />}</>}
 </View>;
}
export const ed = schemeStyles(({ colors: c }) => StyleSheet.create({
 scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 150, gap: 24 },
 title: { fontFamily: typography.family, fontWeight: '600', fontSize: 28, lineHeight: 35, color: c.bone },
 heading: { fontFamily: typography.family, fontWeight: '600', fontSize: 22, lineHeight: 29, color: c.bone },
 body: { fontFamily: typography.family, fontSize: 17, lineHeight: 26, color: c.bone },
 small: { fontFamily: typography.family, fontSize: 14, lineHeight: 21, color: c.muted },
 eyebrow: { fontFamily: typography.family, fontSize: 13, lineHeight: 20, letterSpacing: .4, color: c.muted },
 hero: { height: 230, borderRadius: 0, overflow: 'hidden', backgroundColor: c.panelRaised },
 section: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: 12, gap: 12 },
 row: { minHeight: 48, flexDirection: 'row', gap: 12, alignItems: 'center' },
 depth: { gap: 12, paddingVertical: 8 },
 action: { minHeight: 48, paddingVertical: 12, justifyContent: 'center' },
 actionText: { fontFamily: typography.family, fontSize: 16, lineHeight: 24, color: c.bone, textAlign: 'left' },
}));
