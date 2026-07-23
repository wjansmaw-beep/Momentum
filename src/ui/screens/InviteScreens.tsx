import React, { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { experiences } from '../../product/experienceModel';
import { colors } from '../../design/theme';
import { MiniFact, PrimaryButton, SecondaryButton, AmbientBlobs } from '../primitives';
import { styles } from '../styles/appStyles';
import { useApp } from '../../app/store';
import { RootStackParamList } from '../navigation/types';

// Uitnodigingsschermen (ADR-058): verhuisd uit App.tsx en nu onderdeel van de
// navigatie-fundering — de invite-URL opent ze als eerste scherm via de
// linking-config. Accepteren zet de stack op Nu→Prepare (voorheen
// flowStage 'prepare'); afwijzen (ook Android-back) keert terug naar de
// gewone start (Nu, of Onboarding bij een eerste run).

function useInviteExit() {
  const { personalProfile, declineIncomingInvite } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handledRef = useRef(false);
  const exit = () => {
    handledRef.current = true;
    declineIncomingInvite();
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: personalProfile.onboardingComplete ? 'Now' : 'Onboarding' }],
    }));
  };
  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (handledRef.current) return;
    event.preventDefault();
    exit();
  }), [navigation]);
  // Bij accepteren verdwijnt dit scherm juist óók — dan mag de afwijs-logica
  // niet lopen. De aanroeper markeert dat verwijderen dan toegestaan is.
  const allowRemove = () => { handledRef.current = true; };
  return { exit, allowRemove, handled: handledRef };
}

export function IncomingInviteScreen() {
  const { incomingInvite: invite, inviteIssue, candidatePool, acceptIncomingInvite } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { exit, allowRemove, handled } = useInviteExit();
  const [guestName, setGuestName] = useState('');
  const acceptedRef = useRef(false);
  // Verdediging: zonder invite in de store is er niets te tonen (kan alleen bij
  // een scheme-link zonder geldige payload); val terug op de gewone start.
  // Niet na een geslaagde accept — dan is Prepare al het doel.
  useEffect(() => {
    if (!invite && !acceptedRef.current && !handled.current) exit();
  }, [invite]);
  if (!invite) return <View style={styles.root} />;
  const expired = inviteIssue === 'expired';
  const available = candidatePool.some((item) => item.id === invite.experienceId) || experiences.some((item) => item.id === invite.experienceId);
  const onAccept = (name: string) => {
    acceptedRef.current = true;
    allowRemove();
    if (!acceptIncomingInvite(name)) return;
    navigation.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'Now' }, { name: 'Prepare' }] }));
  };
  return <View style={styles.root}>
    <StatusBar style="light" />
    <AmbientBlobsGoldOnly />
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.inviteScreen} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>UITNODIGING VAN {invite.hostName.toUpperCase()}</Text>
        <Text style={styles.inviteHeadline}>Dit moment kunnen jullie samen beleven.</Text>
        <View style={styles.invitePromiseCard}>
          <Text style={styles.expectationLabel}>GEDEELDE EXPERIENCE CAPSULE</Text>
          <Text style={styles.inviteTitle}>{invite.title}</Text>
          <Text style={styles.invitePromise}>{invite.promise}</Text>
          <View style={styles.factStrip}><MiniFact value={`${invite.duration} min`} label="totaal" /><MiniFact value={invite.company === 'family' ? 'Gezin' : 'Samen'} label="gezelschap" /><MiniFact value={invite.coordination === 'meet-there' ? 'Startpunt' : 'Samen'} label="afspraak" /></View>
        </View>
        <View style={styles.inviteTrustCard}><Text style={styles.inviteTrustTitle}>Jouw gegevens blijven van jou</Text><Text style={styles.inviteTrustBody}>Deze uitnodiging bevat alleen de ervaring en gezamenlijke afspraak. Jouw profiel, agenda, locatiegeschiedenis en voorkeuren worden niet met {invite.hostName} gedeeld.</Text></View>
        <Text style={styles.fieldLabel}>HOE MOGEN WE JE IN DEZE ERVARING NOEMEN?</Text>
        <TextInput value={guestName} onChangeText={setGuestName} placeholder="Je voornaam" placeholderTextColor={colors.placeholder} style={styles.inviteNameInput} />
        {expired ? <View style={styles.unavailableInvite}><Text style={styles.unavailableInviteTitle}>Deze uitnodiging is verlopen</Text><Text style={styles.unavailableInviteBody}>Een uitnodiging blijft 72 uur bruikbaar. Vraag {invite.hostName} om de actuele kaart opnieuw te delen.</Text></View> : available ? <PrimaryButton label="Ik ga mee" onPress={() => onAccept(guestName)} /> : <View style={styles.unavailableInvite}><Text style={styles.unavailableInviteTitle}>Deze kaart is hier nog niet beschikbaar</Text><Text style={styles.unavailableInviteBody}>Open de uitnodiging op een apparaat met dezelfde Momentum-versie. Live informatie wordt altijd opnieuw gecontroleerd.</Text></View>}
        <SecondaryButton label="Niet nu" onPress={exit} />
        <Text style={styles.invitePrototypeNote}>In deze prototypefase wordt deelname alleen op dit apparaat bijgehouden. Veilige synchronisatie volgt pas met een expliciet account- en privacyontwerp.</Text>
      </ScrollView>
    </SafeAreaView>
  </View>;
}

export function InvalidInviteScreen() {
  const { exit } = useInviteExit();
  return <View style={styles.root}><StatusBar style="light" /><SafeAreaView style={styles.safe}><View style={styles.invalidInviteScreen}><Text style={styles.eyebrow}>UITNODIGING</Text><Text style={styles.inviteHeadline}>Deze link kunnen we niet veilig openen.</Text><Text style={styles.screenSubtitle}>De uitnodiging is onvolledig of gemaakt met een niet-ondersteunde versie. Er wordt geen andere ervaring voor in de plaats gekozen.</Text><PrimaryButton label="Ga naar Momentum" onPress={exit} /></View></SafeAreaView></View>;
}

// De gouden ambient-laag zoals het vroegere uitnodigingsscherm die toonde
// (AmbientBlobs goldOnly; zie src/ui/primitives.tsx).
function AmbientBlobsGoldOnly() {
  return <AmbientBlobs goldOnly />;
}
