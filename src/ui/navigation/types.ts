import { Surface } from '../../product/experienceModel';

// Routekaart van de app (ADR-058). De vier surfaces staan elk als eigen scherm
// op de native-stack; de bottomNav wisselt ertussen met replace (identiek aan
// de vroegere directe surface-wissel: geen animatie, geen nieuwe stack-historie,
// Android-back verlaat de app zoals voorheen). Flow-stages, Profiel, Onboarding
// en de uitnodigingsschermen zijn push/modal-schermen op dezelfde stack.
export type RootStackParamList = {
  Now: undefined;
  Today: undefined;
  Discover: undefined;
  LifeBook: undefined;
  Onboarding: undefined;
  IncomingInvite: undefined;
  InvalidInvite: undefined;
  Prepare: undefined;
  Presence: undefined;
  Remember: undefined;
  Profile: undefined;
};

export const surfaceRoutes: Record<Surface, keyof RootStackParamList> = {
  now: 'Now',
  today: 'Today',
  discover: 'Discover',
  lifebook: 'LifeBook',
};

export const routeSurfaces: Partial<Record<keyof RootStackParamList, Surface>> = {
  Now: 'now',
  Today: 'today',
  Discover: 'discover',
  LifeBook: 'lifebook',
};
