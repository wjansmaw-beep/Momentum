import { Platform, useColorScheme } from 'react-native';

// Color language (ADR-061, point 1 — amends ADR-053): cool light canvas
// (#F7F6FA family), pure white cards, a confident deep green as primary action
// (#208049 family) and phase accents as a semantic system. Photography stays
// the warmth source; umber/amber tones remain available as image and support
// hues (gold, onImageAccent). WCAG AA stays hard: every text/background pair
// is computed (accentText principle per accent color).
//
// Evening tone (ADR-064, direction 1): the dark sibling of the same grammar.
// Same roles and tokens, tuned for evening use — deep blue-charcoal surfaces
// (no pure #000 chrome), cards slightly lighter than the canvas, the primary
// action slightly brighter green with a deep on-accent ink for AA, and phase
// accents muted but recognizable. The appearance follows the device via
// useColorScheme(); there is deliberately no in-app toggle.

export type AppearanceScheme = 'light' | 'dark';

export type ColorTokens = {
  ink: string;
  panel: string;
  panelRaised: string;
  backdrop: string;
  bone: string;
  muted: string;
  accent: string;
  gold: string;
  accentText: string;
  placeholder: string;
  mutedSoft: string;
  danger: string;
  line: string;
  softLine: string;
  scrim: string;
  onImage: string;
  onImageMuted: string;
  onImageAccent: string;
  darkGlass: string;
  accentSoft: string;
  accentLine: string;
  shadow: string;
  /** Text/icons on the primary action (white on deep green in daylight; deep green-ink on the brighter evening green). */
  onAccent: string;
  /** Light action surface placed on photography (hero primary action) — same in both appearances. */
  onImageAction: string;
  /** Text on `onImageAction` (equals daylight `bone` in both appearances). */
  onImageActionText: string;
  /** Dark glass behind pills on photography — same in both appearances. */
  onImageGlass: string;
  /** Hairlines on photography or dark glass — same in both appearances. */
  onImageLine: string;
  onImageLineFaint: string;
  onImageAccentLine: string;
  /** Barely-there inset fill behind small controls (suggestion arrows). */
  chipInset: string;
  /** Translucent panel veils for floating controls (back button, resume card). */
  veilStrong: string;
  veilSoft: string;
  /** Blur fallback tints for the bottom navigation and the guide sheet (Glass). */
  glassNav: string;
  glassSheet: string;
  /** Heavier scrim behind the guide sheet. */
  scrimStrong: string;
  /** Ambient breathing layers on the canvas (Now-green above, Prepare-blue below). */
  ambientPrimary: string;
  ambientSecondary: string;
  /** Quiet context notice (amber family, derived from the Remember accent). */
  noticeLine: string;
  noticeSoft: string;
  /** QuietCanvas gradient stops: panel → canvas → raised edge. */
  quietGradient: [string, string, string];
  /** Intentional pure black, reserved for the phone-away moment ("lights out") and its shadow — not app chrome. */
  lightsOut: string;
};

const lightColors: ColorTokens = {
  /** Cool light application canvas (was warm parchment #F3F0E8). */
  ink: '#F7F6FA',
  /** Pure white cards (was warm ivory #FCFAF5). */
  panel: '#FFFFFF',
  /** Cool raised surface inside white cards (was #EAE5DB). */
  panelRaised: '#EFEDF5',
  /** Slightly deeper cool surface behind the appFrame (web frame, navigator). */
  backdrop: '#E9E7F1',
  /** Cool charcoal text (was greenish #1D2722). ≥13:1 on all light surfaces. */
  bone: '#22252D',
  /** Cool grey secondary text: 5.9:1 on white, 5.5:1 on ink (AA). */
  muted: '#5E6470',
  /** Primary action: confident deep green. White text on it: 4.95:1 (AA). */
  accent: '#208049',
  /** Warm amber as image and support hue (photography warmth, ADR-053). */
  gold: '#B68755',
  /** Darker green for accent text on light surfaces: 6.5:1 on `panel`. */
  accentText: '#1C6B3F',
  /** Placeholder and soft secondary ink tints, derived from `muted`. */
  placeholder: 'rgba(94,100,112,0.55)',
  mutedSoft: 'rgba(94,100,112,0.62)',
  /** Quiet signal color for a failing source state; not intended for text on `panel`. */
  danger: '#C56F61',
  line: 'rgba(34,37,45,0.13)',
  softLine: 'rgba(34,37,45,0.07)',
  scrim: 'rgba(8,10,14,0.42)',
  onImage: '#FFFFFF',
  onImageMuted: 'rgba(255,255,255,0.80)',
  /** Warm amber accent on photography — the image warmth source remains (ADR-053/061). */
  onImageAccent: '#E7C99E',
  darkGlass: 'rgba(14,16,22,0.74)',
  accentSoft: 'rgba(32,128,73,0.10)',
  accentLine: 'rgba(32,128,73,0.34)',
  shadow: '#3B3E4C',
  onAccent: '#FFFFFF',
  onImageAction: 'rgba(255,255,255,0.96)',
  onImageActionText: '#22252D',
  onImageGlass: 'rgba(8,10,14,0.62)',
  onImageLine: 'rgba(255,255,255,0.30)',
  onImageLineFaint: 'rgba(255,255,255,0.20)',
  onImageAccentLine: 'rgba(231,201,158,0.52)',
  chipInset: 'rgba(255,255,255,0.04)',
  veilStrong: 'rgba(255,255,255,0.90)',
  veilSoft: 'rgba(255,255,255,0.78)',
  glassNav: 'rgba(255,255,255,0.92)',
  glassSheet: 'rgba(255,255,255,0.94)',
  scrimStrong: 'rgba(8,10,14,0.52)',
  ambientPrimary: 'rgba(32,128,73,0.07)',
  ambientSecondary: 'rgba(47,93,168,0.05)',
  noticeLine: 'rgba(192,138,46,0.28)',
  noticeSoft: 'rgba(192,138,46,0.06)',
  quietGradient: ['#FFFFFF', '#F7F6FA', '#EFEDF6'],
  lightsOut: '#000000',
};

// Evening tone (ADR-064): the same roles as `lightColors`, tuned dark.
// Surfaces are deep blue-charcoal (no pure #000 chrome — `lightsOut` stays
// reserved for the phone-away moment); cards sit one step lighter than the
// canvas. The primary action brightens to #34A463 so it keeps its confidence
// on dark surfaces; because white text would drop below AA on that green,
// on-accent ink becomes a deep green-black (#0A1F13, 5.4:1). Accent text and
// phase accents lighten enough to keep ≥4.5:1 on `panel` (see PR report).
const eveningColors: ColorTokens = {
  /** Deep blue-charcoal canvas. */
  ink: '#131722',
  /** Cards one step lighter than the canvas. */
  panel: '#1C212C',
  /** Raised surface inside cards. */
  panelRaised: '#252B38',
  /** Deepest surface, behind the appFrame. */
  backdrop: '#0D1017',
  /** Primary text: 13.3:1 on `panel`, 12.1:1 on `ink`. */
  bone: '#E8EAF0',
  /** Secondary text: 6.6:1 on `panel`, 6.0:1 on `ink` (AA). */
  muted: '#9AA1AF',
  /** Primary action, brightened for dark surfaces; deep on-accent ink: 5.4:1 (AA). */
  accent: '#34A463',
  /** Warm amber support hue, slightly lifted for dark surfaces. */
  gold: '#C89E6D',
  /** Accent text on dark surfaces: 7.4:1 on `panel` (AA). */
  accentText: '#63C48D',
  placeholder: 'rgba(154,161,175,0.55)',
  mutedSoft: 'rgba(154,161,175,0.62)',
  danger: '#D98A7C',
  line: 'rgba(232,234,240,0.14)',
  softLine: 'rgba(232,234,240,0.08)',
  scrim: 'rgba(3,5,9,0.46)',
  onImage: '#FFFFFF',
  onImageMuted: 'rgba(255,255,255,0.80)',
  onImageAccent: '#E7C99E',
  darkGlass: 'rgba(9,11,16,0.78)',
  accentSoft: 'rgba(52,164,99,0.16)',
  accentLine: 'rgba(52,164,99,0.42)',
  shadow: '#05070B',
  onAccent: '#0A1F13',
  onImageAction: 'rgba(255,255,255,0.96)',
  onImageActionText: '#22252D',
  onImageGlass: 'rgba(8,10,14,0.62)',
  onImageLine: 'rgba(255,255,255,0.30)',
  onImageLineFaint: 'rgba(255,255,255,0.20)',
  onImageAccentLine: 'rgba(231,201,158,0.52)',
  chipInset: 'rgba(255,255,255,0.07)',
  veilStrong: 'rgba(28,33,44,0.90)',
  veilSoft: 'rgba(28,33,44,0.80)',
  glassNav: 'rgba(22,26,35,0.92)',
  glassSheet: 'rgba(28,33,44,0.94)',
  scrimStrong: 'rgba(3,5,9,0.60)',
  ambientPrimary: 'rgba(52,164,99,0.12)',
  ambientSecondary: 'rgba(127,163,224,0.10)',
  noticeLine: 'rgba(214,166,74,0.36)',
  noticeSoft: 'rgba(214,166,74,0.13)',
  quietGradient: ['#1C212C', '#131722', '#181D28'],
  lightsOut: '#000000',
};

type PhaseAccentTokens = {
  accent: string;
  text: string;
  soft: string;
  line: string;
};

export type PhaseTokens = {
  now: PhaseAccentTokens;
  prepare: PhaseAccentTokens & { halo: string };
  presence: {
    accent: string;
    surface: string;
    onSurface: string;
    mutedOnSurface: string;
    line: string;
    /** Hairline inside the presence stage (footer divider). */
    hairline: string;
    /** Progress track on the presence stage. */
    track: string;
  };
  remember: PhaseAccentTokens;
  lifebook: PhaseAccentTokens;
};

/**
 * Phase accents as a semantic system (ADR-061, point 1). Sparing use: one
 * accent role per surface, never decorative noise. Each phase has an `accent`
 * (icons, dots, borders, fills), an AA-safe `text` variant for accent text on
 * light surfaces, and a soft `soft`/`line` for tinted card surfaces. Presence
 * is the only dark, immersive surface: dark stage with purple accent and its
 * own on-surface text tokens — identical in both appearances.
 */
const lightPhase: PhaseTokens = {
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
    halo: 'rgba(47,93,168,0.14)',
  },
  presence: {
    accent: '#8B6FD8',
    surface: '#17131F',
    onSurface: '#F4F1FA',
    mutedOnSurface: 'rgba(244,241,250,0.72)',
    line: 'rgba(244,241,250,0.14)',
    hairline: 'rgba(244,241,250,0.10)',
    track: 'rgba(244,241,250,0.16)',
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

// Evening phase accents: muted but recognizable siblings of the daylight set.
// Every `text` variant keeps ≥4.5:1 on the evening `panel` (see PR report);
// presence stays identical — it already was the dark immersive surface.
const eveningPhase: PhaseTokens = {
  now: {
    accent: '#34A463',
    text: '#63C48D',
    soft: 'rgba(52,164,99,0.16)',
    line: 'rgba(52,164,99,0.42)',
  },
  prepare: {
    accent: '#7FA3E0',
    text: '#9BB9EA',
    soft: 'rgba(127,163,224,0.14)',
    line: 'rgba(127,163,224,0.40)',
    halo: 'rgba(127,163,224,0.18)',
  },
  presence: {
    accent: '#8B6FD8',
    surface: '#17131F',
    onSurface: '#F4F1FA',
    mutedOnSurface: 'rgba(244,241,250,0.72)',
    line: 'rgba(244,241,250,0.14)',
    hairline: 'rgba(244,241,250,0.10)',
    track: 'rgba(244,241,250,0.16)',
  },
  remember: {
    accent: '#D6A64A',
    text: '#E2BC6E',
    soft: 'rgba(214,166,74,0.14)',
    line: 'rgba(214,166,74,0.38)',
  },
  lifebook: {
    accent: '#3FA99C',
    text: '#63C2B6',
    soft: 'rgba(63,169,156,0.14)',
    line: 'rgba(63,169,156,0.40)',
  },
};

// ---------------------------------------------------------------------------
// Appearance mechanism (ADR-064, documented choice)
//
// The app reads tokens through the `colors` and `phase` exports at render
// time. Both are scheme-aware proxies: every property read forwards to the
// palette of the currently active appearance. `App` calls `useAppearance()`
// (or `syncAppearance`) during render; when the device appearance changes,
// `useColorScheme()` re-renders the root and every token read below it
// resolves to the new palette — no context provider, no call-site rewrites,
// and the daylight values stay byte-identical. The sync write is idempotent
// and happens before any child reads tokens, so children always render with
// the active palette. `StyleSheet.create` output is cached per scheme by the
// caller (see appStyles.ts); token objects themselves are plain data.
// ---------------------------------------------------------------------------

let activeScheme: AppearanceScheme = 'light';

export function getAppearanceScheme(): AppearanceScheme {
  return activeScheme;
}

/** Idempotently sync the active palette with the device appearance. */
export function syncAppearance(scheme: 'light' | 'dark' | null | undefined): AppearanceScheme {
  activeScheme = scheme === 'dark' ? 'dark' : 'light';
  return activeScheme;
}

/**
 * Root hook: reads the device appearance (web: prefers-color-scheme), syncs
 * the token layer and re-renders the subtree on change. Call once near the
 * root; components below simply read `colors`/`phase`/`styles`.
 */
export function useAppearance(): AppearanceScheme {
  const scheme = useColorScheme();
  return syncAppearance(scheme === 'unspecified' ? undefined : scheme);
}

/** Proxy that forwards every property read to the palette of the active scheme. */
export function schemeProxy<T extends object>(light: T, dark: T): T {
  return new Proxy(light, {
    get: (_target, property) => Reflect.get(activeScheme === 'dark' ? dark : light, property),
  });
}

/**
 * Build a StyleSheet (or any style object) per appearance scheme and return a
 * scheme-aware proxy. Use for component-local sheets: the builder receives
 * the raw palettes, both variants are created once, and property reads follow
 * the active appearance after the root re-renders via `useAppearance()`.
 */
export function schemeStyles<T extends object>(build: (palette: { colors: ColorTokens; phase: PhaseTokens }) => T): T {
  return schemeProxy(build(palettes.light), build(palettes.dark));
}

export const colors: ColorTokens = schemeProxy(lightColors, eveningColors);
export const phase: PhaseTokens = schemeProxy(lightPhase, eveningPhase);

/** Raw palettes for callers that build per-scheme artifacts (StyleSheets). */
export const palettes: Record<AppearanceScheme, { colors: ColorTokens; phase: PhaseTokens }> = {
  light: { colors: lightColors, phase: lightPhase },
  dark: { colors: eveningColors, phase: eveningPhase },
};

export const typography = {
  family: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    default: 'sans-serif',
  }),
  /** Editorial display serif (Fraunces, bundled via @expo-google-fonts) for titles with story character. */
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
 * Spacing scale (ADR-058): the fixed steps the shared styles already used,
 * now named so new surfaces keep one rhythm.
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
 * Elevation tokens (ADR-058): shadow roles for floating layers. `frame` is
 * the soft web frame of the appFrame (carried over unchanged). The frame
 * shadow follows the active palette's `shadow` token, so builders receive it
 * via `frameElevation(paletteColors)`.
 */
export function frameElevation(paletteColors: ColorTokens) {
  return {
    shadowColor: paletteColors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 8 },
  };
}

export const elevation = {
  frame: frameElevation(lightColors),
};

/**
 * Motion tokens (ADR-058): shared tempos, in line with src/design/motion.ts.
 * All motion respects reduced-motion as a hard requirement (ADR-057).
 */
export const motion = {
  /** Duration of one calm enter transition / image settle in ms. */
  settleMs: 560,
  /** Offset between consecutive entrance layers in ms. */
  entranceStaggerMs: 100,
  /** Minimum breathing cycle for ambient layers in ms (sub-perceptual). */
  ambientBreathMs: 12000,
  /** Minimum Ken Burns cycle on the hero in ms. */
  kenBurnsMs: 9500,
};
