import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';
import {
  cancelAnimation,
  Easing as ReanimatedEasing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Beweging volgens ADR-057: rustige, overdragende motion — nooit aandacht vangend.
// Elke animatie in deze module respecteert reduced-motion als harde eis:
// bij "verminder beweging" wordt de eindtoestand direct getoond, zonder beweging.
//
// Migratiekeuze (Horizon B, vastgelegd): de Horizon A-entree (useStaggeredEntrance)
// en de pressed-springs (usePressSpring) blijven op de ingebouwde Animated API —
// die werkt identiek op web én native en heeft geen worklet-/gebaarcontext nodig.
// Reanimated wordt ingezet waar shared values en gebaren echte meerwaarde hebben:
// drag-/swipe-fysica (gids-sheet, suggestie-paging, pull-to-refresh), de trage
// ademende ambient-lagen, Ken Burns op de hero en de beeldcontinuïteit in de flow.

const webPrefersReducedMotion = () =>
  Platform.OS === 'web' && typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useReducedMotionState(): { reduced: boolean; checked: boolean } {
  const [state, setState] = useState<{ reduced: boolean; checked: boolean }>(() => ({
    // Op web is de voorkeur synchroon bekend; elders wachten we op AccessibilityInfo.
    reduced: webPrefersReducedMotion(),
    checked: Platform.OS === 'web',
  }));
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => { if (mounted) setState({ reduced: Boolean(value) || webPrefersReducedMotion(), checked: true }); })
      .catch(() => { if (mounted) setState((current) => ({ ...current, checked: true })); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      setState({ reduced: Boolean(value) || webPrefersReducedMotion(), checked: true });
    });
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return state;
}

/** Reactieve reduced-motion-vlag (AccessibilityInfo + web matchMedia). */
export function useReducedMotion(): boolean {
  return useReducedMotionState().reduced;
}

const useNative = Platform.OS !== 'web';

export type EntranceOptions = {
  /** Vertraging tussen opeenvolgende lagen in ms (ADR-057: ~80–120ms). */
  offset?: number;
  /** Duur per laag in ms. */
  duration?: number;
  /** Verticale stijging in dp. */
  distance?: number;
};

/**
 * Verspringende entree voor gestapelde lagen (fade + lichte stijging).
 * Geeft per laag een animated style terug. Bij reduced-motion: direct eindtoestand.
 */
export function useStaggeredEntrance(count: number, { offset = 100, duration = 420, distance = 14 }: EntranceOptions = {}): Array<StyleProp<ViewStyle>> {
  const { reduced, checked } = useReducedMotionState();
  const values = useMemo(() => Array.from({ length: count }, () => new Animated.Value(reduced ? 1 : 0)), [count]);
  const started = useRef(false);
  useEffect(() => {
    if (!checked || started.current) return;
    started.current = true;
    if (reduced) {
      values.forEach((value) => value.setValue(1));
      return;
    }
    Animated.stagger(offset, values.map((value) => Animated.timing(value, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    }))).start();
  }, [checked, reduced, values, offset, duration]);
  if (reduced) return Array.from({ length: count }, () => ({ opacity: 1 }));
  return values.map((value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  } as unknown as ViewStyle));
}

/**
 * Spring-gebaseerde pressed-state (scale) als vervanger van statische opacity.
 * Bij reduced-motion gebeurt de schaal direct, zonder springbeweging.
 */
export function usePressSpring({ pressedScale = 0.965 }: { pressedScale?: number } = {}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const toValue = (target: number) => {
    if (reduced) { scale.setValue(target); return; }
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: useNative,
      speed: 34,
      bounciness: 5,
    }).start();
  };
  return {
    onPressIn: () => toValue(pressedScale),
    onPressOut: () => toValue(1),
    animatedStyle: (reduced ? {} : { transform: [{ scale }] }) as unknown as ViewStyle,
  };
}

// ---------------------------------------------------------------------------
// Reanimated-helpers (Horizon B). Alle helpers hieronder vallen stil bij
// reduced-motion: de shared value blijft op de ruststand staan en er starten
// geen loops of transities. Timers/loops worden opgeschoond bij unmount.
// ---------------------------------------------------------------------------

type BreathingOptions = {
  /** Duur van één hele ademhaling (heen én terug) in ms; bewust traag (≥5s). */
  period?: number;
  /** Maximale schaal op het hoogtepunt van de ademhaling. */
  scaleTo?: number;
  /** Optionele opacity op het hoogtepunt (start is altijd 1). */
  opacityTo?: number;
  /** Startvertraging in ms zodat lagen niet synchroon ademen. */
  delay?: number;
};

/**
 * Trage ademhaling voor ambient-lagen en rustmomenten (ambientGold/ambientUmber,
 * quiet-state-orb, Phone Away-gloed). Eén heel trage heen-en-weer-cyclus;
 * sub-perceptueel en nooit opvallend. Bij reduced-motion: volledig stil.
 */
export function useBreathing({ period = 12000, scaleTo = 1.06, opacityTo, delay = 0 }: BreathingOptions = {}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) { cancelAnimation(progress); progress.value = 0; return undefined; }
    progress.value = withDelay(delay, withRepeat(
      withTiming(1, { duration: Math.max(2500, period / 2), easing: ReanimatedEasing.inOut(ReanimatedEasing.sin) }),
      -1,
      true,
    ));
    return () => cancelAnimation(progress);
  }, [reduced, period, delay, progress]);
  return useAnimatedStyle(() => ({
    opacity: opacityTo === undefined ? 1 : interpolate(progress.value, [0, 1], [1, opacityTo]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, scaleTo]) }],
  }));
}

/**
 * Sub-perceptuele Ken Burns op de Nu-hero (ADR-057: ≤4% scale, ≥8s per richting,
 * zeer traag heen-en-weer — geen opvallende loop). Bij reduced-motion: stilstaand.
 */
export function useKenBurns({ scaleTo = 1.04, period = 9500 }: { scaleTo?: number; period?: number } = {}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) { cancelAnimation(progress); progress.value = 0; return undefined; }
    progress.value = withRepeat(
      withTiming(1, { duration: Math.max(8000, period), easing: ReanimatedEasing.inOut(ReanimatedEasing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [reduced, period, progress]);
  return useAnimatedStyle(() => ({ transform: [{ scale: interpolate(progress.value, [0, 1], [1, scaleTo]) }] }));
}

/**
 * Beeldcontinuïteit Nu → Prepare → Presence (Horizon B, punt 6).
 * Gekozen aanpak: gecoördineerde enter-transities. Elke flow-stage toont dezelfde
 * beeld-uri (expo-image memory-disk-cache maakt die direct beschikbaar) en de
 * container maakt bij het binnenkomen één rustige "neerleg"-beweging — een lichte
 * scale van 1.045 naar 1 met een zachte fade — met dezelfde duur en easing in
 * elke stage. Daardoor voelt het alsof het beeld doorreist in plaats van springt.
 * Bewust géén echte shared-element-transitie: die vereist gedeelde layout-meting
 * vanuit een navigatie-framework, en dat is Horizon C (niet goedgekeurd).
 * Bij reduced-motion: direct eindtoestand.
 */
export function useImageContinuity({ duration = 560 }: { duration?: number } = {}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) { cancelAnimation(progress); progress.value = 1; return undefined; }
    progress.value = withTiming(1, { duration, easing: ReanimatedEasing.out(ReanimatedEasing.cubic) });
    return () => cancelAnimation(progress);
  }, [reduced, duration, progress]);
  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.35, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1.045, 1]) }],
  }));
}
