import { byId, Experience, LiveEvidence, RoutePlan } from '../product/experienceModel';
import { PrototypeContext } from '../product/localIntelligence';
import { BirdObservation, Coordinates, LiveWorldSnapshot, NearbyPlace } from './liveWorld';

export type OpportunityKind = 'recent-nature' | 'open-place';
export type OpportunityStatus = 'ready' | 'withheld';

export type LivingWorldOpportunity = {
  id: string;
  kind: OpportunityKind;
  status: OpportunityStatus;
  score: number;
  title: string;
  promise: string;
  wonder: string;
  destinationName: string;
  destination: Coordinates;
  experienceKind: Experience['kind'];
  route: RoutePlan;
  evidence: LiveEvidence[];
  reasons: string[];
  guards: string[];
};

export type OpportunityEngineResult = {
  ready: LivingWorldOpportunity[];
  withheld: Array<{ id: string; reason: string }>;
  considered: number;
  sourceLabel: string;
};

const rad = (value: number) => value * Math.PI / 180;
const distanceKm = (a: Coordinates, b: Coordinates) => {
  const earth = 6371; const dLat = rad(b.latitude - a.latitude); const dLon = rad(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const expiresAfter = (base: string, hours: number) => {
  const time = Date.parse(base); return new Date((Number.isFinite(time) ? time : 0) + hours * 3600000).toISOString();
};

const routeFor = (source: Coordinates, destination: Coordinates, destinationName: string, availableMinutes: number, maxTravelMinutes: number, bike: boolean, sourceLabel: string, expiresAt: string, guard: string): RoutePlan | undefined => {
  const directKm = distanceKm(source, destination);
  const mode: RoutePlan['mode'] = bike && directKm > 1.8 ? 'cycling' : 'walking';
  const roadFactor = 1.28;
  const minutesPerKm = mode === 'cycling' ? 4.5 : 13.5;
  const outboundMinutes = Math.max(4, Math.ceil(directKm * roadFactor * minutesPerKm));
  if (outboundMinutes > maxTravelMinutes) return undefined;
  const bufferMinutes = Math.max(5, Math.ceil(availableMinutes * 0.08));
  const experienceMinutes = Math.min(45, availableMinutes - outboundMinutes * 2 - bufferMinutes);
  if (experienceMinutes < 12) return undefined;
  return {
    mode, source, destination, destinationName, outboundMinutes, returnMinutes: outboundMinutes, experienceMinutes, bufferMinutes, natureGuard: guard,
    estimateKind: 'straight-line-conservative', sourceLabel, expiresAt, recheckLabel: 'Momentum controleert het bronvenster opnieuw vóór de Maps-handoff. Apple Maps bepaalt de echte route en reistijd.',
  };
};

const birdOpportunity = (bird: BirdObservation, snapshot: LiveWorldSnapshot, context: PrototypeContext, maxTravelMinutes: number, bike: boolean): LivingWorldOpportunity | { id: string; reason: string } => {
  const id = `opportunity-bird-${bird.locationId}`;
  if (!bird.publicLocation) return { id, reason: 'Geen openbare bronlocatie.' };
  const expiresAt = expiresAfter(snapshot.retrievedAt, 12);
  if (Date.parse(expiresAt) <= Date.now()) return { id, reason: 'Het waarnemingsvenster is verlopen.' };
  const destination = { latitude: bird.latitude, longitude: bird.longitude };
  const guard = 'Ga alleen naar de openbare bronlocatie, blijf op toegestane paden en zoek nooit naar een nest. De ervaring blijft waardevol zonder de soort te zien.';
  const route = routeFor(snapshot.coordinates, destination, bird.locationName, context.availableMinutes, maxTravelMinutes, bike, 'eBird openbare bronlocatie', expiresAt, guard);
  if (!route) return { id, reason: 'De heenweg, beleving, terugweg en buffer passen niet verantwoord binnen dit moment.' };
  const evidence: LiveEvidence = { label: `${bird.commonName} gemeld bij ${bird.locationName}`, sourceName: 'eBird', sourceUrl: 'https://ebird.org/', observedAt: bird.observedAt, retrievedAt: snapshot.retrievedAt, expiresAt, certainty: 'observation' };
  return {
    id, kind: 'recent-nature', status: 'ready', score: 92 - route.outboundMinutes, title: `Naar het landschap van de ${bird.commonName.toLowerCase()}`,
    promise: `Een recente openbare melding geeft richting aan een wandeling; het landschap blijft het doel, ook wanneer de vogel alweer weg is.`,
    wonder: `${bird.locationName} is nu haalbaar binnen je tijd. Kijk breed naar lucht, water en land in plaats van één waarneming na te jagen.`,
    destinationName: bird.locationName, destination, experienceKind: 'outside', route, evidence: [evidence],
    reasons: ['Recente openbare natuurwaarneming', `Conservatieve ${route.mode === 'cycling' ? 'fiets-' : 'wandel'}inschatting past met terugkeerbuffer`, 'De ervaring blijft waardevol zonder waarneming'],
    guards: [guard, 'Waarneming is geen garantie voor huidige aanwezigheid.'],
  };
};

const placeKind = (place: NearbyPlace): Experience['kind'] => place.kind === 'cafe' ? 'food' : ['museum', 'gallery'].includes(place.kind) ? 'culture' : place.kind === 'library' ? 'learn' : place.kind === 'community' ? 'connect' : 'outside';

const placeOpportunity = (place: NearbyPlace, snapshot: LiveWorldSnapshot, context: PrototypeContext, maxTravelMinutes: number, bike: boolean): LivingWorldOpportunity | { id: string; reason: string } => {
  const id = `opportunity-place-${place.id}`;
  if (place.openingState !== 'open') return { id, reason: place.openingState === 'closed' ? 'Volgens eenvoudige openbare tijden gesloten.' : 'Opening of toegang is niet betrouwbaar genoeg.' };
  const expiresAt = expiresAfter(snapshot.retrievedAt, 6);
  if (Date.parse(expiresAt) <= Date.now()) return { id, reason: 'Het plaats- en openingsvenster is verlopen.' };
  const destination = { latitude: place.latitude, longitude: place.longitude };
  const guard = 'OpenStreetMap kan achterlopen. Controleer vóór vertrek de actuele toegang en volg ter plaatse borden en aanwijzingen.';
  const route = routeFor(snapshot.coordinates, destination, place.name, context.availableMinutes, maxTravelMinutes, bike, 'OpenStreetMap plaatslead', expiresAt, guard);
  if (!route) return { id, reason: 'Deze plek past niet met heenweg, ervaring, terugweg en buffer binnen de gekozen tijd.' };
  const kind = placeKind(place);
  const promise = kind === 'culture' ? 'Laat één lokaal verhaal, beeld of gebouw je omgeving opnieuw openen.' : kind === 'food' ? 'Maak ruimte voor één smaak en de sfeer van een nabije plek.' : kind === 'learn' ? 'Zoek één idee dat je buiten het scherm verder laat kijken.' : kind === 'connect' ? 'Een openbare plek geeft een eenvoudig begin voor tijd samen.' : 'Een nabije openbare plek maakt van vrije tijd een kleine ontdekking.';
  return {
    id, kind: 'open-place', status: 'ready', score: 76 - route.outboundMinutes, title: `Ontdek ${place.name}`, promise,
    wonder: `${place.name} ligt dichtbij genoeg om niet alleen heen te gaan, maar ook rustig te beleven en met buffer terug te keren.`,
    destinationName: place.name, destination, experienceKind: kind, route,
    evidence: [{ label: `${place.name} · ${place.openingNote}`, sourceName: 'OpenStreetMap', sourceUrl: 'https://www.openstreetmap.org/copyright', observedAt: snapshot.retrievedAt, retrievedAt: snapshot.retrievedAt, expiresAt, certainty: 'observation' }],
    reasons: ['Open volgens conservatief geïnterpreteerde openbare tijden', `Past met ${route.bufferMinutes} minuten buffer`, 'Apple Maps controleert de werkelijke route'], guards: [guard],
  };
};

export function composeLivingWorldOpportunities(snapshot: LiveWorldSnapshot, context: PrototypeContext, options: { maxTravelMinutes: number; bike: boolean }): OpportunityEngineResult {
  const age = Date.now() - Date.parse(snapshot.retrievedAt);
  if (!Number.isFinite(age) || age > 2 * 3600000) return { ready: [], withheld: [{ id: 'snapshot', reason: 'De regionale bronset is te oud voor nieuwe kansen.' }], considered: 0, sourceLabel: 'Living World verlopen' };
  const raw = [
    ...snapshot.birdObservations.slice(0, 8).map((bird) => birdOpportunity(bird, snapshot, context, options.maxTravelMinutes, options.bike)),
    ...snapshot.nearbyPlaces.slice(0, 15).map((place) => placeOpportunity(place, snapshot, context, options.maxTravelMinutes, options.bike)),
  ];
  const ready = raw.filter((item): item is LivingWorldOpportunity => 'status' in item).sort((a, b) => b.score - a.score).slice(0, 4);
  const withheld = raw.filter((item): item is { id: string; reason: string } => !('status' in item));
  return { ready, withheld, considered: raw.length, sourceLabel: ready.length ? `${ready.length} uitvoerbare kansen uit actuele bronnen` : 'Geen uitvoerbare actuele kans' };
}

export function opportunityToExperience(opportunity: LivingWorldOpportunity): Experience {
  const base = opportunity.experienceKind === 'outside' ? byId('wadden-light') : opportunity.experienceKind === 'food' ? byId('pantry-dinner') : opportunity.experienceKind === 'connect' ? byId('family-mission') : opportunity.experienceKind === 'learn' ? byId('small-reading') : byId('one-song-listening');
  const route = opportunity.route;
  return {
    ...base, id: opportunity.id, kind: opportunity.experienceKind, title: opportunity.title, promise: opportunity.promise, wonder: opportunity.wonder,
    duration: route.outboundMinutes + route.experienceMinutes + route.returnMinutes + route.bufferMinutes, distance: `${route.outboundMinutes} min tot start`, timeWindow: `bron geldig tot ${new Date(route.expiresAt ?? 0).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`,
    cta: 'Bereid deze ontdekking voor', why: opportunity.reasons, prepareTitle: `Klaar voor ${opportunity.destinationName}?`,
    prepare: [...opportunity.guards, 'Controleer vlak voor vertrek de bronstatus en Maps-route'], presenceMode: 'handoff', presenceTitle: opportunity.destinationName,
    presenceCue: 'Laat Maps eerst de echte route bepalen. Ter plaatse neemt de gids het weer over.', routePlan: route, liveEvidence: opportunity.evidence,
    steps: [
      { title: 'Controleer kans en toegang', instruction: `${opportunity.evidence[0].label}. ${opportunity.guards[0]}`, insight: { title: 'Een kans, geen belofte', body: 'Momentum gebruikt de bron om richting te geven. Wat je werkelijk aantreft en lokale aanwijzingen blijven leidend.', topic: opportunity.experienceKind === 'culture' ? 'culture' : 'place', sourceKind: 'live', sourceLabel: opportunity.evidence[0].sourceName } },
      { title: 'Laat Maps de route bepalen', instruction: 'Open de bestemming pas wanneer het bronvenster nog actueel is. Maps controleert de werkelijke route en reistijd.', meta: `${route.outboundMinutes} min geschat heen` },
      { title: 'Beleef één detail volledig', instruction: opportunity.experienceKind === 'outside' ? 'Kijk breed naar landschap, licht, geluid en beweging. Laat één soort of plek nooit de hele ervaring bepalen.' : 'Kies één beeld, verhaal, smaak, ontmoeting of vraag. Je hoeft de plek niet af te werken.' },
      { title: 'Bescherm je terugkeer', instruction: `Vertrek uiterlijk na ongeveer ${route.experienceMinutes} minuten terug en houd de ${route.bufferMinutes} minuten buffer intact.` },
    ],
    memoryPrompt: `Welk detail van ${opportunity.destinationName} wil je onthouden?`, keywords: [...base.keywords, 'live world', 'route', 'dichtbij'], company: ['solo', 'together', 'family'],
    guideOrigin: { mode: 'composed', label: 'Opportunity Engine v2 · actuele bron, tijdsbudget en routegrens' },
    blueprint: { id: 'living-world-opportunity-v2', domain: opportunity.experienceKind, origin: 'deterministic', validationLabel: 'Bronvenster, openbare bestemming, tijdsbudget en routegrens gecontroleerd' },
  };
}
