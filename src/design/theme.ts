import { Platform } from 'react-native';

export const colors = {
  ink: '#080B0A',
  panel: '#121715',
  panelRaised: '#19201C',
  bone: '#F6F2EA',
  muted: '#AEB5AD',
  green: '#B9CF77',
  gold: '#D9B477',
  line: 'rgba(246,242,234,0.12)',
  softLine: 'rgba(246,242,234,0.07)',
  scrim: 'rgba(5,8,7,0.52)',
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
