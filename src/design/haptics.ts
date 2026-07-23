import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Tactiele feedback (ADR-057, Horizon A). Op web en andere niet-ondersteunde
// platforms is elke helper bewust een stille no-op; fouten van de native module
// worden nooit doorgegeven aan de interface.
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Lichte tik voor chips, tabs en selecties. */
export const impactLight = () => {
  if (supported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};

/** Medium tik voor de primaire commitment-actie. */
export const impactMedium = () => {
  if (supported) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
};

/** Succesignaal bij bewaren van een herinnering en afronden van een ervaring. */
export const notificationSuccess = () => {
  if (supported) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
};
