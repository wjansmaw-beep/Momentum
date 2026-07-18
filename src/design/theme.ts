import { Platform } from 'react-native';

export const colors = {
  ink: '#0B0E0D',
  panel: '#141816',
  panelRaised: '#1A1F1C',
  bone: '#F3F0E9',
  muted: '#A7ADA7',
  green: '#B6CC82',
  gold: '#D7B77B',
  line: 'rgba(243,240,233,0.10)',
  softLine: 'rgba(243,240,233,0.06)',
  scrim: 'rgba(5,7,6,0.48)',
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
