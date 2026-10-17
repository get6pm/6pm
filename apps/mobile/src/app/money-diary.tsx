import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { monthOf } from '@6pm/domain';

import { useMoney } from '../data/money-provider';
import { coverTint, zineInk } from '../features/diary/diary-colours';
import { ZineCover } from '../features/diary/zine/zine-cover';
import { ZineGrain } from '../features/diary/zine/zine-grain';
import { ZineDays, ZineNote, ZinePlaces, ZineTickets } from '../features/diary/zine/zine-pages';
import { ZineShare, zineCardTilt } from '../features/diary/zine/zine-share';
import { useMoneyDiary } from '../features/diary/zine/use-money-diary';
import { captureView } from '../features/sharing/capture-view';
import { cardOnPaper } from '../features/sharing/card-on-paper';
import { shareFileName } from '../features/sharing/share-file';
import { useShareImage } from '../features/sharing/use-share-image';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetFrame } from '../ui/navigation/sheet-frame';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body, mono } from '../ui/type/fonts';

const MONTH = /^\d{4}-\d{2}$/;
/** Page around the shared card: room for the tilt, and for its shadow below. */
const CARD_MARGIN = { side: 36, top: 36, bottom: 64 };

/**
 * A month's Money diary, bound on the 1st: the headline, four stats, where it went, the quietest
 * and biggest days, every closed day, a note from 6pm and a card to share (amounts off unless
 * the user turns them on).
 */
export default function MoneyDiary() {
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string }>();
  const { today } = useMoney();
  // A link without a month (the Max welcome's button) opens this month's diary.
  const month = params.month && MONTH.test(params.month) ? params.month : monthOf(today);
  const { serious } = useTheme();
  const { t } = useI18n();
  const [showAmounts, setShowAmounts] = useState(false);
  const zine = useMoneyDiary(month, showAmounts);
  const tint = coverTint(month);
  const card = useRef<ComponentRef<typeof View>>(null);
  const { share, save, photosOff } = useShareImage();
  // The card exactly as shown, amounts only if the switch is on, laid on its grainy page.
  const cardImage = async () =>
    cardOnPaper(await captureView(card), { ...zineCardTilt, paper: tint, margin: CARD_MARGIN });
  const fileName = shareFileName('money-diary', month);

  const header = (
    <View
      style={{
        paddingTop: 8,
        paddingHorizontal: 20,
        paddingBottom: 4,
        gap: 4,
      }}
    >
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: zineInk.grabber,
        }}
      />
      <View
        style={{
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ ...mono(11, 400, 0.16), color: zineInk.ink, opacity: 0.6 }}>
          {zine ? t('diary.zine.kicker', { no: zine.no }) : ''}
        </Text>
        <PressScale
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={{ paddingVertical: 8, paddingHorizontal: 2 }}
        >
          <Text style={{ ...body(17, 650), color: zineInk.ink }}>{t('common.done')}</Text>
        </PressScale>
      </View>
    </View>
  );

  return (
    // The header sits on the same grained paper as the pages, so the two read as one sheet.
    <SheetFrame background={tint}>
      <View style={{ flex: 1, backgroundColor: tint }}>
        <ZineGrain />
        {header}
        {zine ? (
          <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, gap: 30 }}
            >
              <ZineCover
                title={zine.title}
                headline={zine.headline}
                closed={zine.closedText}
                stampLabel={t('diary.zine.stamp')}
                stats={zine.stats}
              />
              {zine.places.length > 0 ? (
                <ZinePlaces title={t('diary.zine.places')} places={zine.places} />
              ) : null}
              <ZineTickets quiet={zine.quiet} big={zine.big} />
              <ZineDays
                title={t('diary.zine.every')}
                count={zine.closedText}
                days={zine.everyDay}
              />
              <ZineNote note={zine.note} signoff={t('diary.zine.signoff')} serious={serious} />
              <ZineShare
                title={t('diary.zine.share')}
                brand={t('diary.zine.shareBrand')}
                month={zine.share.month}
                tint={zine.tint}
                closed={zine.closedText}
                daysLabel={t('diary.zine.shareDays')}
                dots={zine.share.dots}
                stat={zine.share.stat}
                footer={t('diary.zine.shareFooter')}
                showLabel={t('diary.zine.showAmounts')}
                showSub={t('diary.zine.showAmountsSub')}
                showAmounts={showAmounts}
                onToggle={() => {
                  haptics.tick();
                  setShowAmounts((on) => !on);
                }}
                cardRef={card}
                saveLabel={t(photosOff ? 'sharing.openSettings' : 'sharing.saveImage')}
                shareLabel={t('sharing.share')}
                onSave={() => void save(fileName, cardImage)}
                onShare={() => void share(fileName, cardImage)}
              />
            </ScrollView>
          </Animated.View>
        ) : null}
      </View>
    </SheetFrame>
  );
}
