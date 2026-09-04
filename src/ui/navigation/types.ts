// Routekaart van de app (ADR-058). De surfaces staan elk als eigen scherm op
// de native-stack; de tabbalk wisselt ertussen met replace (identiek aan de
// vroegere directe surface-wissel: geen animatie, geen nieuwe stack-historie,
// Android-back verlaat de app zoals voorheen). Flow-stages, Onboarding en de
// uitnodigingsschermen zijn push/modal-schermen op dezelfde stack.
//
// ADR-067 (fase R1): het skelet is vijf tabs — NU · DAG · GIDS · BOEK ·
// JIJ. Vervolg op R4: GIDS ís het onderweg-scherm zelf — de vroegere
// hervatkaart en het aparte Presence-scherm zijn samengevoegd tot één Gids
// met drie toestanden (stap, verdieping, telefoon-weg). Profiel (JIJ) is
// geen modal meer maar een surface in het skelet.
export type RootStackParamList = {
  Now: undefined;
  Today: undefined;
  Guide: undefined;
  LifeBook: undefined;
  Profile: undefined;
  Onboarding: undefined;
  IncomingInvite: undefined;
  InvalidInvite: undefined;
  Prepare: undefined;
  Remember: undefined;
};

export type TabId = 'nu' | 'dag' | 'gids' | 'boek' | 'jij';

/** De vijf tabroutes in skeletvolgorde (ADR-067 §3). De gids-route wordt door
 * de tabbalk en Nu niet rechtstreeks vervangen maar via resumeSession naar de
 * passende sessiestage (Guide bij presence, Prepare bij prepare) geleid. */
export const tabRoutes: Record<TabId, keyof RootStackParamList> = {
  nu: 'Now',
  dag: 'Today',
  gids: 'Guide',
  boek: 'LifeBook',
  jij: 'Profile',
};

/** Welke route welke tab activeert. Guide ís de GIDS-tab; schermen buiten
 * het skelet (flow-stages) activeren geen tab. */
export const routeTabs: Partial<Record<keyof RootStackParamList, TabId>> = {
  Now: 'nu',
  Today: 'dag',
  Guide: 'gids',
  LifeBook: 'boek',
  Profile: 'jij',
};
