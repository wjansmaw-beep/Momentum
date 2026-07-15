import { Platform } from 'react-native';

export const colors = {
  ink: '#071013',
  panel: '#101A1D',
  bone: '#F4EEE3',
  muted: '#AEB4AE',
  green: '#A4C55D',
  gold: '#D9B36B',
  line: 'rgba(244,238,227,0.14)',
};

export const typography = {
  editorial: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia, Times New Roman, serif', default: 'serif' }),
  minimumLabelSize: 11,
  minimumTouchTarget: 44,
};
