import { useCallback, useMemo, useRef } from 'react';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { gestures } from '@6pm/theme';

import { haptics } from '../../ui/haptics';
import { release } from '../../ui/motion/physics';
import { rowOffset, rowRelease } from './row-release';

/** Far enough that a row flung away has left the screen before the list closes the gap. */
const GONE = 440;
const reduceMotion = ReduceMotion.System;

export type RowAction = 'confirm' | 'delete' | 'open';

export interface RowSwipeHandlers {
  readonly onConfirm: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onOpen: (id: string) => void;
}

/**
 * A spend row's swipe. Right past 90 pt confirms a caught spend; left past −48 it stays open at
 * −96 on its Delete, past −150 it deletes. The release reads where the flick was heading, so a
 * quick flick commits short of the line; the row then carries the finger's speed. Haptic ticks
 * mark each threshold. A tap opens the spend, or closes an open row.
 *
 * `confirmAway` sends a confirmed row off to the right before it is confirmed, for a list it
 * leaves (the Inbox); Today keeps a confirmed row, so it springs home. `tapWaitsFor` is a
 * gesture inside the row (a button) that a tap on the row gives way to.
 */
export function useRowSwipe(
  id: string,
  reviewable: boolean,
  handlers: RowSwipeHandlers,
  { confirmAway = false, tapWaitsFor }: { confirmAway?: boolean; tapWaitsFor?: GestureType } = {},
) {
  const x = useSharedValue(0);
  const start = useSharedValue(0);

  // Read through a ref so the list's fresh callbacks each render do not rebuild the gestures.
  const current = useRef(handlers);
  current.current = handlers;
  const act = useCallback((action: RowAction, target: string) => {
    const h = current.current;
    if (action === 'confirm') h.onConfirm(target);
    else if (action === 'delete') h.onDelete(target);
    else h.onOpen(target);
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onStart(() => {
        start.set(x.get());
      })
      .onUpdate((e) => {
        const next = rowOffset(start.get() + e.translationX, reviewable);
        const was = x.get();
        if (
          was > gestures.rowCommitDelete !== next > gestures.rowCommitDelete ||
          (reviewable && was > gestures.rowConfirm !== next > gestures.rowConfirm)
        ) {
          scheduleOnRN(haptics.tick);
        }
        x.set(next);
      })
      .onEnd((e) => {
        const velocity = e.velocityX;
        const decision = rowRelease(x.get(), velocity, reviewable);
        if (decision === 'delete') {
          scheduleOnRN(haptics.commit);
          x.set(
            withSpring(-GONE, { ...release.away, velocity, reduceMotion }, (finished) => {
              if (finished) scheduleOnRN(act, 'delete', id);
            }),
          );
          return;
        }
        if (decision === 'confirm') {
          scheduleOnRN(haptics.tap);
          if (confirmAway) {
            x.set(
              withSpring(GONE, { ...release.away, velocity, reduceMotion }, (finished) => {
                if (finished) scheduleOnRN(act, 'confirm', id);
              }),
            );
            return;
          }
          scheduleOnRN(act, 'confirm', id);
        }
        const target = decision === 'reveal' ? -gestures.rowDeleteWidth : 0;
        x.set(withSpring(target, { ...release.home, velocity, reduceMotion }));
      });
    const tap = Gesture.Tap().onEnd((_e, success) => {
      if (!success) return;
      if (x.get() !== 0) x.set(withSpring(0, { ...release.home, reduceMotion }));
      else scheduleOnRN(act, 'open', id);
    });
    if (tapWaitsFor) tap.requireExternalGestureToFail(tapWaitsFor);
    return Gesture.Exclusive(pan, tap);
  }, [x, start, id, reviewable, act, confirmAway, tapWaitsFor]);

  const front = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const deleteAway = useCallback(() => {
    haptics.commit();
    x.set(
      withSpring(-GONE, { ...release.away, reduceMotion }, (finished) => {
        if (finished) scheduleOnRN(act, 'delete', id);
      }),
    );
  }, [x, act, id]);

  /**
   * `x` drives the face and what the swipe uncovers; `gesture` (the swipe and the tap) and
   * `front` (its transform) go on the face; `deleteAway` flings the row off to the left and then
   * deletes it, for the panel's button and the menu.
   */
  return { x, gesture, front, deleteAway, act };
}
