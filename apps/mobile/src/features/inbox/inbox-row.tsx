import { useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import { useRowSwipe } from '../today/row-swipe';
import type { SpendRowView } from '../today/spend-row';
import { SpendRowBackdrop } from '../today/spend-row-backdrop';
import { SpendRowMenu } from '../today/spend-row-menu';

const layout = LinearTransition.springify().damping(22).stiffness(240);
const rowIn = FadeIn.duration(220);
const rowOut = FadeOut.duration(180);
const reduceMotion = ReduceMotion.System;

export interface InboxRowLabels {
  readonly keep: string;
  readonly confirm: string;
  readonly edit: string;
  readonly skip: string;
}

/**
 * One waiting spend: what, when, where it came from, and a round ✓ to keep it. Swiped right it
 * is confirmed and leaves; swiped left it opens on Skip, or past the line is skipped. A tap opens
 * it to fix; held, it offers Confirm, Edit and Skip. The swipe is Today's row's, thresholds and all.
 */
export function InboxRow({
  row,
  labels,
  amountMissing,
  onKeep,
  onConfirm,
  onSkip,
  onOpen,
}: {
  readonly row: SpendRowView;
  readonly labels: InboxRowLabels;
  /** Nothing was read for it: "No amount" stands where 0₫ would. */
  readonly amountMissing: boolean;
  /** The ✓: keeps it with a tap you can feel. */
  readonly onKeep: (id: string) => void;
  /** The swipe and the menu, which bring their own feel. */
  readonly onConfirm: (id: string) => void;
  readonly onSkip: (id: string) => void;
  readonly onOpen: (id: string) => void;
}) {
  const { palette } = useTheme();
  const { id, reviewable } = row;

  // The ✓ answers on the UI thread like the row does, so a tap on it never also opens the row.
  const keepRef = useRef(onKeep);
  keepRef.current = onKeep;
  const sunk = useSharedValue(0);
  const check = useMemo(() => {
    const keep = (target: string) => keepRef.current(target);
    return Gesture.Tap()
      .maxDistance(10)
      .onBegin(() => {
        sunk.set(withTiming(1, { duration: 100, easing: easeOut, reduceMotion }));
      })
      .onFinalize(() => {
        sunk.set(withTiming(0, { duration: 150, easing: easeOut, reduceMotion }));
      })
      .onEnd((_e, success) => {
        if (success) scheduleOnRN(keep, id);
      });
  }, [sunk, id]);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.05 * sunk.get() }] }));

  const { x, gesture, front, deleteAway, act } = useRowSwipe(
    id,
    reviewable,
    { onConfirm, onDelete: onSkip, onOpen },
    { confirmAway: true, tapWaitsFor: check },
  );

  return (
    <Animated.View
      layout={layout}
      entering={rowIn}
      exiting={rowOut}
      style={{
        overflow: 'hidden',
        borderTopWidth: 0.5,
        borderTopColor: row.first ? 'transparent' : palette.hair,
      }}
    >
      <SpendRowBackdrop
        x={x}
        confirmLabel={labels.confirm}
        deleteLabel={labels.skip}
        deleteIcon="close"
        onDeletePress={deleteAway}
      />
      <SpendRowMenu
        href={`/spend/${id}`}
        reviewable={reviewable}
        confirmLabel={labels.confirm}
        editLabel={labels.edit}
        deleteLabel={labels.skip}
        deleteIcon="xmark"
        onConfirm={() => act('confirm', id)}
        onEdit={() => act('open', id)}
        onDelete={deleteAway}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View
            accessible
            accessibilityRole="button"
            accessibilityLabel={[row.name, row.foreign?.printed ?? row.amount, row.meta]
              .filter(Boolean)
              .join(', ')}
            accessibilityActions={[
              { name: 'activate' },
              { name: 'confirm', label: labels.keep },
              { name: 'delete', label: labels.skip },
            ]}
            onAccessibilityAction={(event) => {
              const name = event.nativeEvent.actionName;
              if (name === 'activate') act('open', id);
              else if (name === 'confirm') act('confirm', id);
              else if (name === 'delete') act('delete', id);
            }}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingLeft: 16,
                paddingRight: 12,
                backgroundColor: palette.cell,
              },
              front,
            ]}
          >
            <CategoryTile icon={row.icon} hue={row.hue} />
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text numberOfLines={1} style={{ ...body(16, 550), color: palette.ink }}>
                {row.name}
              </Text>
              <Text numberOfLines={1} style={{ ...body(13), color: palette.inkSoft }}>
                {row.meta}
              </Text>
            </View>
            <InboxAmount row={row} amountMissing={amountMissing} />
            <GestureDetector gesture={check}>
              <Animated.View
                hitSlop={2}
                style={[
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: palette.btnBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  checkStyle,
                ]}
              >
                <Symbol name="check" size={22} color={palette.btnFg} />
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        </GestureDetector>
      </SpendRowMenu>
    </Animated.View>
  );
}

/** The amount as printed, with its home amount under it when it was spent in another currency. */
function InboxAmount({
  row,
  amountMissing,
}: {
  readonly row: SpendRowView;
  readonly amountMissing: boolean;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  if (row.foreign) {
    return (
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={{ ...body(16, 600), ...tabular, color: palette.ink }}>
          {row.foreign.printed}
        </Text>
        <Text style={{ ...body(13), ...tabular, color: palette.inkSoft }}>
          {row.foreign.inHome === null
            ? t('inbox.ratePending')
            : t('inbox.inDong', { amount: row.foreign.inHome })}
        </Text>
      </View>
    );
  }
  if (amountMissing) {
    return <Text style={{ ...body(15, 550), color: palette.inkSoft }}>{t('inbox.noAmount')}</Text>;
  }
  return <Text style={{ ...body(16, 600), ...tabular, color: palette.ink }}>{row.amount}</Text>;
}
