import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

// Beweging volgens ADR-057: rustige, overdragende motion — nooit aandacht vangend.
// Elke animatie in deze module respecteert reduced-motion als harde eis:
// bij "verminder beweging" wordt de eindtoestand direct getoond, zonder beweging.

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
