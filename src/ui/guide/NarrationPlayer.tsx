import { schemeStyles } from '../../design/theme';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function NarrationPlayer({ source, transcript }: { source: number; transcript: string }) {
  const player = useAudioPlayer(source, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const focused = useIsFocused();
  const allowed = useRef(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  useEffect(() => {
    allowed.current = focused && AppState.currentState === 'active';
    setBusy(false);
    if (!focused) { player.pause(); setInterrupted(true); }
    const listener = AppState.addEventListener('change', state => {
      allowed.current = focused && state === 'active';
      if (state !== 'active') { player.pause(); setInterrupted(true); }
    });
    return () => { allowed.current = false; listener.remove(); };
  }, [focused, player]);
  // useAudioPlayer owns/release the native player on unmount. Chapter changes
  // remount this component; mode changes unmount it. Neither starts playback.
  const play = async () => {
    if (status.playing) { player.pause(); return; }
    setBusy(true); setError('');
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false,
        shouldPlayInBackground: false, interruptionMode: 'doNotMix' });
      if (!allowed.current) return;
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.1)) await player.seekTo(0);
      if (!allowed.current) return;
      setInterrupted(false); player.play();
    } catch { if (allowed.current) setError('Afspelen lukte niet. Probeer opnieuw of lees de tekst.'); }
    finally { if (allowed.current) setBusy(false); }
  };
  const seek = async (seconds: number) => {
    try { await player.seekTo(Math.max(0, Math.min(status.duration, seconds))); }
    catch { setError('Verplaatsen in de audio lukte niet.'); }
  };
  const time = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
  const failed = error || status.error;
  return <View style={s.panel}>
    <Text style={s.text}>Voorgelezen verhaal · Nederlandse computerstem</Text>
    <Text accessibilityLiveRegion="polite" style={s.text}>{failed ? 'Audio kon niet worden afgespeeld.' : interrupted ? 'Onderbroken · hervat wanneer je wilt' : status.isBuffering ? 'Audio laden…' : !status.isLoaded ? 'Audio voorbereiden…' : status.playing ? 'Speelt' : status.didJustFinish ? 'Afgerond' : 'Klaar om te luisteren'}</Text>
    <Text style={s.time}>{time(status.currentTime)} / {time(status.duration)}</Text>
    <View style={s.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="15 seconden terug" disabled={!status.isLoaded || busy} onPress={() => seek(status.currentTime - 15)} style={s.button}><Text style={s.ink}>−15 s</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={!status.isLoaded || busy} onPress={play} style={s.button}><Text style={s.ink}>{status.playing ? 'Pauzeer' : 'Speel af'}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="15 seconden vooruit" disabled={!status.isLoaded || busy} onPress={() => seek(status.currentTime + 15)} style={s.button}><Text style={s.ink}>+15 s</Text></Pressable>
    </View>
    {!!failed && <Pressable accessibilityRole="button" onPress={() => { setError(''); player.replace(source); }} style={s.button}><Text style={s.ink}>Laad audio opnieuw</Text></Pressable>}
    <Text style={s.small}>De audio stopt bij verlaten of vergrendelen. Hervatten doe je zelf.</Text>
    <Pressable accessibilityRole="button" aria-expanded={transcriptOpen} accessibilityState={{ expanded: transcriptOpen }} onPress={() => setTranscriptOpen(v => !v)} style={s.button}><Text style={s.ink}>{transcriptOpen ? 'Verberg tekst' : 'Lees mee'}</Text></Pressable>
    {transcriptOpen && <Text style={s.text}>{transcript}</Text>}
  </View>;
}

const s = schemeStyles(({ colors: c }) => StyleSheet.create({
  panel: { gap: 14 }, text: { color: c.bone, fontSize: 17, lineHeight: 26 },
  time: { color: c.muted, fontSize: 22, fontVariant: ['tabular-nums'] },
  small: { color: c.bone, fontSize: 14, lineHeight: 21 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { minHeight: 48, minWidth: 48, backgroundColor: c.accent, padding: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  ink: { color: c.onAccent, fontSize: 16 },
}));
