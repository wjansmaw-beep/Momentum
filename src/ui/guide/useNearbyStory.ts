import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import type { Experience } from '../../product/experienceModel';
import { nearbyStory, supportsNearbyStory, type NearbyStory } from '../../guidance/nearbyStory';
import { readForegroundPosition } from '../../guidance/foregroundPosition';

export function useNearbyStory(experience: Experience, index: number, enabled: boolean, setEnabled: (value:boolean)=>void) {
  const focused=useIsFocused();
  const supported=supportsNearbyStory(experience);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [result,setResult]=useState<NearbyStory>();
  const request=useRef<AbortController | null>(null);
  const lastCheck=useRef(0);
  const dismissed=useRef<number | null>(null);
  const prompting=useRef(false);
  const previousChapter=useRef(index);
  const latest=useRef({experience,index,enabled,focused,setEnabled});
  latest.current={experience,index,enabled,focused,setEnabled};
  const cancel=()=>{request.current?.abort();request.current=null;setBusy(false);setResult(undefined);};
  const check=async (manual=false)=>{
    const current=latest.current;
    if (!supported || !current.enabled || !current.focused || AppState.currentState!=='active' || request.current) return;
    if (!manual && Date.now()-lastCheck.current<60000) return;
    if (Platform.OS==='web') {setMessage('Locatievoorstellen zijn beschikbaar in de iPhone-app. Je kunt hier zelf een hoofdstuk kiezen.');return;}
    lastCheck.current=Date.now();
    const controller=new AbortController();request.current=controller;setBusy(true);setResult(undefined);setMessage('');
    try {
      const sample=await readForegroundPosition({
        permission:async()=> (await Location.getForegroundPermissionsAsync()).status==='granted',
        watch:(receive,fail)=>Location.watchPositionAsync({accuracy:Location.Accuracy.Balanced},v=>receive({latitude:v.coords.latitude,longitude:v.coords.longitude,accuracy:v.coords.accuracy,timestamp:v.timestamp}),fail),
      },controller.signal);
      if(controller.signal.aborted) return;
      const next=nearbyStory(current.experience,current.index,sample,Date.now());
      if(next.kind==='proposal' && next.index===dismissed.current) {setMessage('Je blijft bij je gekozen verhaal.');return;}
      setResult(next);
      setMessage(next.kind==='current' ? 'Je huidige verhaal past bij deze omgeving.' : next.kind==='far' ? 'Geen plek van deze tocht duidelijk dichtbij. Kies zelf een hoofdstuk.' : next.kind==='uncertain' ? 'Je locatie is niet precies genoeg om één plek te kiezen. Je kunt zelf een hoofdstuk kiezen.' : '');
    } catch(error) {
      if(!controller.signal.aborted) setMessage(error instanceof Error && error.message==='denied'
        ? 'Locatietoegang staat uit. Je verhaal blijft beschikbaar; kies zelf een hoofdstuk.'
        : 'Je locatie is nu niet beschikbaar. Je verhaal blijft beschikbaar; probeer het later opnieuw.');
    } finally {if(request.current===controller){request.current=null;setBusy(false);}}
  };
  const enable=async()=>{
    if(request.current || !focused) return;
    if(Platform.OS==='web'){setMessage('Locatievoorstellen zijn beschikbaar in de iPhone-app. Je kunt hier zelf een hoofdstuk kiezen.');return;}
    const controller=new AbortController();request.current=controller;setBusy(true);prompting.current=true;
    try {
      const permission=await Location.requestForegroundPermissionsAsync();
      if(controller.signal.aborted || !latest.current.focused) return;
      if(permission.status==='granted') {lastCheck.current=0;latest.current.setEnabled(true);}
      else setMessage('Geen locatietoegang gegeven. Je kunt alle verhalen zelf blijven kiezen.');
    } catch {if(!controller.signal.aborted) setMessage('Locatietoegang kon niet worden gevraagd. Probeer het later opnieuw.');}
    finally {prompting.current=false;if(request.current===controller){request.current=null;setBusy(false);}}
  };
  useEffect(()=>{
    const changedChapter=previousChapter.current!==index;
    previousChapter.current=index;
    dismissed.current=null;setMessage('');setResult(undefined);setBusy(false);
    if(supported && enabled && focused && !changedChapter) void check();
    let previous=AppState.currentState;
    const listener=AppState.addEventListener('change',state=>{
      if(state!=='active' && (!prompting.current || state==='background')) cancel();
      if(state==='active' && previous!=='active') {dismissed.current=null;void check();}
      previous=state;
    });
    return ()=>{request.current?.abort();request.current=null;listener.remove();};
  },[experience.id,index,enabled,focused,supported]);
  useEffect(()=>{
    if(result?.kind!=='proposal') return;
    const timer=setTimeout(()=>{setResult(undefined);setMessage('Het locatievoorstel is verlopen. Controleer opnieuw wanneer je wilt.');},Math.max(0,result.expiresAt-Date.now()));
    return ()=>clearTimeout(timer);
  },[result]);
  return {supported,enabled,busy,message,result,
    enable, retry:()=>{dismissed.current=null;void check(true);},
    disable:()=>{cancel();setMessage('');setEnabled(false);},
    dismiss:()=>{if(result?.kind==='proposal') dismissed.current=result.index;setResult(undefined);setMessage('Je blijft bij je gekozen verhaal.');},
    accept:()=>{if(result?.kind!=='proposal' || result.expiresAt<=Date.now()) {setResult(undefined);setMessage('Controleer je locatie opnieuw voor een actueel voorstel.');return undefined;}const target=result.index;setResult(undefined);return target;},
  };
}
