import React, { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Platform, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, useAppearance } from '../../design/theme';
import { localMuseumAnswer, museumQuestionContext, museumQuestions, requestGuideAnswer } from '../../guidance/guideQuestion';
import type { GuideAnswer } from '../../guidance/guideQuestion';
import { ed, EditorialAction, EditorialDisclosure } from '../editorial';
declare const process: { env: { EXPO_PUBLIC_MOMENTUM_GENERATOR_URL?: string } };

// Ephemeral, mounted only for this chapter: no session/storage writes.
export function GuideQuestion() {
  useAppearance();
  const base = process.env.EXPO_PUBLIC_MOMENTUM_GENERATOR_URL ?? (Platform.OS === 'web' ? 'http://127.0.0.1:8787/v1/experience-drafts' : undefined);
  const local = !base;
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<GuideAnswer>();
  const [answeredQuestion, setAnsweredQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef<AbortController | null>(null);
  const serial = useRef(0);
  const cancel = useCallback(() => {
    serial.current++; pending.current?.abort(); pending.current = null; setBusy(false);
  }, []);
  useFocusEffect(useCallback(() => {
    const listener = AppState.addEventListener('change', state => { if (state !== 'active') cancel(); });
    return () => { listener.remove(); cancel(); setAnswer(undefined); setQuestion(''); setMessage(''); };
  }, [cancel]));
  const send = async () => {
    cancel(); const id = serial.current; const controller = new AbortController(); pending.current = controller;
    setBusy(true); setMessage(''); setAnswer(undefined);
    const submitted = question.trim();
    try {
      const request = { ...museumQuestionContext, question: submitted, requestId: `museum_${Date.now()}_${id}` };
      const result = local ? localMuseumAnswer(request) : await requestGuideAnswer({
        base,
        native: Platform.OS !== 'web', signal: controller.signal,
        request,
      });
      if (!result) throw new Error('invalid');
      if (serial.current !== id || controller.signal.aborted) return;
      setAnswer(result); setAnsweredQuestion(submitted);
    } catch (error) {
      if (serial.current !== id || controller.signal.aborted) return;
      setMessage(error instanceof Error && error.message === 'unconfigured'
        ? 'De gidsdienst is op dit apparaat nog niet verbonden. Het verhaal blijft beschikbaar.'
        : error instanceof Error && error.message === 'unsupported'
          ? 'Deze gidsdienst ondersteunt museumvragen nu niet. Je kunt het verhaal en de bronnen blijven lezen.'
          : 'Het antwoord is nu niet bereikbaar. Je vraag blijft staan; probeer het opnieuw wanneer je verbinding hebt.');
    } finally { if (serial.current === id) { pending.current = null; setBusy(false); } }
  };
  return <EditorialDisclosure title="Vraag aan je gids">
    <Text style={ed.small}>Over Museum ’t Fiskershúske</Text>
    <Text style={ed.body}>Deze proef geeft gecontroleerde redactionele uitleg bij drie museumvragen. Vrije AI-antwoorden zijn nog niet aangesloten.</Text>
    {museumQuestions.map(prompt => <EditorialAction key={prompt} title={prompt} disabled={busy} onPress={() => setQuestion(prompt)} />)}
    <TextInput accessibilityLabel="Je vraag over het museum" placeholder="Wat wil je over deze plek weten?"
      placeholderTextColor={colors.muted} multiline maxLength={600} editable={!busy} value={question} onChangeText={setQuestion}
      style={[ed.body, { minHeight: 100, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 8, textAlignVertical: 'top' }]} />
    <Text style={ed.small}>{local ? 'Deze uitleg staat op je telefoon en werkt zonder verbinding. Je vraag wordt niet verstuurd of bewaard.' : 'Met Verstuur stuur je alleen je vraag en dit hoofdstuk naar de ingestelde gidsdienst. Geen locatie, profiel of herinneringen. Je vraag wordt niet in je boek bewaard.'}</Text>
    {busy ? <><Text accessibilityLiveRegion="polite" style={ed.small}>Je vraag wordt opgehaald…</Text><EditorialAction title="Annuleer" onPress={() => { cancel(); setMessage('Geannuleerd. Je vraag blijft staan.'); }} /></>
      : <EditorialAction primary title={local ? 'Toon uitleg' : 'Verstuur'} disabled={question.trim().length < 3} onPress={send} />}
    {!!message && <Text accessibilityRole="alert" style={ed.small}>{message}</Text>}
    {answer && <View style={ed.depth} accessibilityLiveRegion="polite">
      <Text style={ed.small}>Redactionele uitleg · {answeredQuestion}</Text>
      {answer.segments.map(segment => <Text key={segment.factId} style={ed.body}>{segment.text} [1]</Text>)}
      {answer.limitation && <Text style={ed.body}>{answer.limitation}</Text>}
      {!!answer.sources.length && <EditorialDisclosure title="Bron bij dit antwoord">
        {answer.sources.map(source => <View key={source.id} style={ed.depth}>
          <Text style={ed.small}>[1] {source.title} · gecontroleerd {source.checkedAt}</Text>
          <Text style={ed.small}>{source.scope}</Text>
          <EditorialAction title="Bekijk de oorspronkelijke bron ↗" onPress={() => { Linking.openURL(source.url).catch(() => setMessage('De bron kan nu niet worden geopend.')); }} />
        </View>)}
      </EditorialDisclosure>}
    </View>}
  </EditorialDisclosure>;
}
