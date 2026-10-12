import { Easing, LinearTransition } from 'react-native-reanimated';

import { curves } from '@6pm/theme';

/** Siblings glide to their new place when chips or a line come in, on the entrance curve. */
export const glide = LinearTransition.duration(300).easing(Easing.bezier(...curves.enter));
