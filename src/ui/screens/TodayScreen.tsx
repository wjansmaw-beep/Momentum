import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useApp, defaultRegion } from '../../app/store';
import { useAppearance } from '../../design/theme';
import { EnergyLevel, energyLabels } from '../../product/localIntelligence';
import { composeTravelGuide } from '../../product/travelGuide';
import { SurfaceFrame } from '../frames';
import { ed, EditorialAction, EditorialDisclosure, OpenExperience, ResumeExperience, SaveExperience } from '../editorial';
import { dayTimeline, discoveryCard, NIGHT_ITEM } from '../now-v2/dayModel';
import { formatLongDate, resolveSunTimes } from '../now-v2/nowModel';

// ADR-073: retain the existing day intelligence as optional context, not a
// planner or fifth tab. All experience entry uses the shared session guard.
export function TodayScreen() {
  const app = useApp(); useAppearance();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const sun = useMemo(() => resolveSunTimes(app.liveWorld?.weather, app.liveWorld?.coordinates ?? defaultRegion.coordinates, now),
    [app.liveWorld, now.toDateString()]);
  const items = useMemo(() => dayTimeline(now, sun, app.dayDecisions,
    app.calendarContext.state === 'live' ? app.calendarContext.freeWindows : [], app.personalProfile),
    [now, sun, app.dayDecisions, app.calendarContext, app.personalProfile]);
  const guide = useMemo(() => composeTravelGuide({ candidatePool: app.candidatePool, liveWorld: app.liveWorld,
    locationLinked: app.selectionLocationConfirmed }), [app.candidatePool, app.liveWorld, app.selectionLocationConfirmed]);
  const discovery = discoveryCard(now, sun, guide, new Set(app.dayDecisions.map(moment => moment.result.experience.id)));
  return <SurfaceFrame><ScrollView contentContainerStyle={ed.scroll}>
    <Text accessibilityRole="header" style={ed.title}>Vandaag</Text>
    <Text style={ed.small}>{formatLongDate(now)}</Text>
    <Text style={ed.body}>Mogelijkheden voor je dag. Dit zijn suggesties, geen afspraken of vastgelegd plan.</Text>
    <ResumeExperience />
    <EditorialDisclosure title="Hoeveel energie heb je?">
      <Text style={ed.small}>Alleen voor vandaag, op dit apparaat.</Text>
      {(['low', 'steady', 'full'] as EnergyLevel[]).map(level => <EditorialAction key={level} title={energyLabels[level]}
        selected={app.energyLevel === level} onPress={() => app.setEnergyCheckin(app.energyLevel === level ? null : level)} />)}
    </EditorialDisclosure>
    {!items.some(item => item.kind === 'moment') && <Text style={ed.body}>Er is nu geen passend dagvoorstel.</Text>}
    {items.map((item, index) => {
      if (item.kind === 'energy' || item.kind === 'night') return null;
      return <View key={item.id ?? index} style={ed.section}>
        <Text style={ed.small}>{item.when}{item.state === 'past' ? ' · eerder vandaag' : ''}</Text>
        <Text accessibilityRole="header" style={ed.heading}>{item.title}</Text>
        <Text style={ed.body}>{item.kind === 'moment' && item.state !== 'past' ? `${item.experience.duration} minuten · ${item.experience.effort}` : item.sub}</Text>
        {item.kind === 'moment' && <>
          {item.state !== 'past' && <OpenExperience experience={item.experience} from="today" />}
          <SaveExperience experience={item.experience} />
        </>}
      </View>;
    })}
    {discovery && <EditorialDisclosure title={discovery.kicker}>
      <Text style={ed.heading}>{discovery.title}</Text><Text style={ed.body}>{discovery.detail}</Text>
      <OpenExperience experience={discovery.experience} from="today" /><SaveExperience experience={discovery.experience} />
    </EditorialDisclosure>}
    <EditorialDisclosure title="Vrije ruimte in je agenda">
      <Text style={ed.body}>{app.calendarContext.detail}</Text>
      <EditorialAction title={app.calendarLoading ? 'Agenda controleren…' : 'Controleer mijn agenda'} disabled={app.calendarLoading}
        onPress={() => { app.connectCalendar().catch(() => undefined); }} />
    </EditorialDisclosure>
    <EditorialDisclosure title={NIGHT_ITEM.title}><Text style={ed.body}>{NIGHT_ITEM.sub}</Text></EditorialDisclosure>
  </ScrollView></SurfaceFrame>;
}
