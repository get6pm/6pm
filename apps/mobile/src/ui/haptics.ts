import * as Haptics from 'expo-haptics';

/**
 * The design's one `buzz()` split into the three feelings iOS offers, so each moment gets the
 * right weight: a tick for crossing a threshold, a tap for an action, a success for finishing.
 */
export const haptics = {
  /** Tab scrub, wheel row, a swipe crossing its threshold. */
  tick: () => void Haptics.selectionAsync(),
  /** Keep / edit / not mine, FAB long-press, sheet dismissed, undo. */
  tap: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  /** The close done, the reveal settling, a purchase made. */
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};
