import { Platform } from 'react-native';

export const colors = {
  ink: '#F3F0E8',
  panel: '#FCFAF5',
  panelRaised: '#EAE5DB',
  bone: '#1D2722',
  muted: '#687269',
  accent: '#9A6848',
  /** @deprecated Tijdelijke alias voor `accent`; blijft tot alle bestaande gebruiken zijn gemigreerd. */
  green: '#9A6848',
  gold: '#B68755',
  /** Donkerdere umber-variant voor tekst op lichte vlakken: circa 4,9:1 op `panel` (WCAG AA voor kleine tekst). */
  accentText: '#8F6539',
  /** Placeholder- en zachte secundaire inkttinten, afgeleid van `muted`. */
  placeholder: 'rgba(104,114,105,0.55)',
  mutedSoft: 'rgba(104,114,105,0.62)',
  /** Rustige signaalkleur voor een foutieve bronstatus; niet bedoeld voor tekst op `panel`. */
  danger: '#C56F61',
  line: 'rgba(29,39,34,0.13)',
  softLine: 'rgba(29,39,34,0.07)',
  scrim: 'rgba(6,9,8,0.42)',
  onImage: '#FFFDF8',
  onImageMuted: 'rgba(255,253,248,0.78)',
  onImageAccent: '#E7C99E',
  darkGlass: 'rgba(16,20,18,0.74)',
  accentSoft: 'rgba(154,104,72,0.10)',
  accentLine: 'rgba(154,104,72,0.30)',
  shadow: '#4B4037',
};

export const typography = {
  family: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    default: 'sans-serif',
  }),
  minimumLabelSize: 11,
  minimumTouchTarget: 44,
};

export const radii = {
  control: 18,
  card: 24,
  hero: 28,
  pill: 999,
};
