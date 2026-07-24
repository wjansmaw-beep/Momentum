import { Platform } from 'react-native';

// Kleurtaal (ADR-061, punt 1 — amendeert ADR-053): de warme daglichtbasis wordt
// ververst, niet vervangen. Koel licht canvas (#F7F6FA-familie), zuiver witte
// kaarten, een zelfverzekerd diepgroen als primaire actie (#208049-familie) en
// fase-accenten als semantisch systeem. Fotografie blijft de warmtebron;
// umber/amber-tonen blijven als beeld- en ondersteuningstinten beschikbaar
// (gold, onImageAccent). WCAG AA blijft hard: elke tekst/achtergrond-combinatie
// is nagerekend (zie PR-rapport; accentText-principe per accentkleur uitgebreid).
export const colors = {
  /** Koel licht applicatiecanvas (was warm perkament #F3F0E8). */
  ink: '#F7F6FA',
  /** Zuiver witte kaarten (was warm ivoor #FCFAF5). */
  panel: '#FFFFFF',
  /** Koel verhoogd vlak binnen witte kaarten (was #EAE5DB). */
  panelRaised: '#EFEDF5',
  /** Iets dieper koel vlak achter het appFrame (web-omlijsting, navigator). */
  backdrop: '#E9E7F1',
  /** Koele houtskool-tekst (was groenig #1D2722). ≥13:1 op alle lichte vlakken. */
  bone: '#22252D',
  /** Koele grijze secundaire tekst: 5,9:1 op wit, 5,5:1 op ink (AA). */
  muted: '#5E6470',
  /** Primaire actie: zelfverzekerd diepgroen. Witte tekst erop: 4,95:1 (AA). */
  accent: '#208049',
  /** Warme amber als beeld- en ondersteuningstint (fotografie-warmte, ADR-053). */
  gold: '#B68755',
  /** Donkerder groen voor accent-tekst op lichte vlakken: 6,5:1 op `panel`. */
  accentText: '#1C6B3F',
  /** Placeholder- en zachte secundaire inkttinten, afgeleid van `muted`. */
  placeholder: 'rgba(94,100,112,0.55)',
  mutedSoft: 'rgba(94,100,112,0.62)',
  /** Rustige signaalkleur voor een foutieve bronstatus; niet bedoeld voor tekst op `panel`. */
  danger: '#C56F61',
  line: 'rgba(34,37,45,0.13)',
  softLine: 'rgba(34,37,45,0.07)',
  scrim: 'rgba(8,10,14,0.42)',
  onImage: '#FFFFFF',
  onImageMuted: 'rgba(255,255,255,0.80)',
  /** Warm amber accent op fotografie — de beeld-warmtebron blijft (ADR-053/061). */
  onImageAccent: '#E7C99E',
  darkGlass: 'rgba(14,16,22,0.74)',
  accentSoft: 'rgba(32,128,73,0.10)',
  accentLine: 'rgba(32,128,73,0.34)',
  shadow: '#3B3E4C',
};

/**
 * Fase-accenten als semantisch systeem (ADR-061, punt 1). Spaarzaam gebruik:
 * één accentrol per surface, nooit decoratieve ruis. Elke fase kent een
 * `accent` (iconen, dots, randen, vullingen), een AA-veilige `text`-variant
 * voor accent-tekst op lichte vlakken, en een zachte `soft`/`line` voor
 * getinte kaartvlakken. Presence is de enige donkere, immersieve surface:
 * donker vlak met paars accent en eigen on-surface teksttokens.
 */
export const phase = {
  now: {
    accent: '#208049',
    text: '#1C6B3F',
    soft: 'rgba(32,128,73,0.10)',
    line: 'rgba(32,128,73,0.34)',
  },
  prepare: {
    accent: '#2F5DA8',
    text: '#2A5194',
    soft: 'rgba(47,93,168,0.09)',
    line: 'rgba(47,93,168,0.34)',
  },
  presence: {
    accent: '#8B6FD8',
    surface: '#17131F',
    onSurface: '#F4F1FA',
    mutedOnSurface: 'rgba(244,241,250,0.72)',
    line: 'rgba(244,241,250,0.14)',
  },
  remember: {
    accent: '#C08A2E',
    text: '#8F6414',
    soft: 'rgba(192,138,46,0.10)',
    line: 'rgba(192,138,46,0.32)',
  },
  lifebook: {
    accent: '#1E7D70',
    text: '#176A5E',
    soft: 'rgba(30,125,112,0.09)',
    line: 'rgba(30,125,112,0.34)',
  },
};

export const typography = {
  family: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    default: 'sans-serif',
  }),
  /** Redactionele display-serif (Fraunces, gebundeld via @expo-google-fonts) voor titels met verhaalkarakter. */
  displayFamily: 'Fraunces_600SemiBold',
  displayFamilyMedium: 'Fraunces_500Medium',
  displayFamilyItalic: 'Fraunces_500Medium_Italic',
  minimumLabelSize: 11,
  minimumTouchTarget: 44,
};

export const radii = {
  control: 18,
  card: 24,
  hero: 28,
  pill: 999,
};

/**
 * Spacing-schaal (ADR-058): de vaste stappen die de gedeelde stijlen al
 * gebruikten, nu benoemd zodat nieuwe oppervlakken één ritme houden.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screenGutter: 20,
  navInset: 18,
};

/**
 * Elevation-tokens (ADR-058): schaduwrollen voor drijvende lagen. `frame` is
 * de zachte web-omlijsting van het appFrame (ongewijzigd overgenomen).
 */
export const elevation = {
  frame: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 8 },
  },
};

/**
 * Motion-tokens (ADR-058): gedeelde tempo's, in lijn met src/design/motion.ts.
 * Alle beweging respecteert reduced-motion als harde eis (ADR-057).
 */
export const motion = {
  /** Duur van één rustige enter-transitie / beeld-neerleg in ms. */
  settleMs: 560,
  /** Verspringing tussen opeenvolgende entree-lagen in ms. */
  entranceStaggerMs: 100,
  /** Minimale ademhalingscyclus voor ambient-lagen in ms (sub-perceptueel). */
  ambientBreathMs: 12000,
  /** Minimale Ken Burns-cyclus op de hero in ms. */
  kenBurnsMs: 9500,
};
