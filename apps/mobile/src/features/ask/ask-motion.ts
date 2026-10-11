import { Easing, Keyframe } from 'react-native-reanimated';

/** CSS `ease`, the timing the prototype's `rise` uses by default. */
const cssEase = Easing.bezier(0.25, 0.1, 0.25, 1);
/** The bubbles' overshoot: `cubic-bezier(.2,1.2,.4,1)`. */
const bubbleEase = Easing.bezier(0.2, 1.2, 0.4, 1);
/** `growX` and the answer bars: `cubic-bezier(.2,.9,.2,1)`. */
export const growEase = Easing.bezier(0.2, 0.9, 0.2, 1);

/** `rise`: .4 s up from 14 pt low. */
export const riseIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 14 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: cssEase },
}).duration(400);

function popIn(duration: number) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.6 }] },
    100: { opacity: 1, transform: [{ scale: 1 }], easing: bubbleEase },
  }).duration(duration);
}

/** `bubbleIn` for what the user says (.35 s, from its tail at the bottom right). */
export const meBubbleIn = popIn(350);
/** `bubbleIn` for 6pm's answers (.4 s, from its tail at the bottom left). */
export const answerBubbleIn = popIn(400);
