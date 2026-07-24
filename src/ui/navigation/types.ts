import { Surface } from '../../product/experienceModel';

// Routekaart van de app (ADR-058). De surfaces staan elk als eigen scherm op
// de native-stack; de tabbalk wisselt ertussen met replace (identiek aan de
// vroegere directe surface-wissel: geen animatie, geen nieuwe stack-historie,
// Android-back verlaat de app zoals voorheen). Flow-stages, Onboarding en de
// uitnodigingsschermen zijn push/modal-schermen op dezelfde stack.
//
// ADR-067 (fase R1): het skelet is nu vijf tabs — NU · DAG · GIDS · BOEK ·
// JIJ. GIDS krijgt met Guide een eigen rustige thuisroute die doorverwijst
// naar de bestaande Presence-begeleiding zodra er een actieve ervaring is;
// Profiel (JIJ) is geen modal meer maar een surface in het skelet.
export type RootStackParamList = {
  Now: undefined;
  Today: undefined;
  Guide: undefined;
  LifeBook: undefined;
  Profile: undefined;
  Discover: undefined;
  Onboarding: undefined;
  IncomingInvite: undefined;
  InvalidInvite: undefined;
  Prepare: undefined;
  Presence: undefined;
  Remember: undefined;
};

export type TabId = 'nu' | 'dag' | 'gids' | 'boek' | 'jij';

/** De vijf tabroutes in skeletvolgorde (ADR-067 §3). */
export const tabRoutes: Record<TabId, keyof RootStackParamList> = {
  nu: 'Now',
  dag: 'Today',
  gids: 'Guide',
  boek: 'LifeBook',
  jij: 'Profile',
};

/** Welke route welke tab activeert. Presence hoort bij GIDS; schermen buiten
 * het skelet (Discover via deep link, flow-stages) activeren geen tab. */
export const routeTabs: Partial<Record<keyof RootStackParamList, TabId>> = {
  Now: 'nu',
  Today: 'dag',
  Guide: 'gids',
  Presence: 'gids',
  LifeBook: 'boek',
  Profile: 'jij',
};

/** Herkomst van een geopende ervaring blijft de bestaande Surface-semantiek
 * (openExperience); dat is iets anders dan de tab-indeling. */
export const surfaceRoutes: Record<Surface, keyof RootStackParamList> = {
  now: 'Now',
  today: 'Today',
  discover: 'Discover',
  lifebook: 'LifeBook',
};
