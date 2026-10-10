import { Text, View } from 'react-native';

import { formatShort, type RecapStory, type WeekRecap } from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { Companion } from '../../ui/companion/companion';
import { DashedRule } from '../../ui/dashed-rule';
import { isSymbolName } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { merchantIcon } from '../today/merchant-icon';
import { inkWash, recapAccent } from './diary-colours';

function storyText(
  story: RecapStory,
  t: ReturnType<typeof useI18n>['t'],
): readonly [string, string] {
  switch (story.kind) {
    case 'under':
      return [
        t('diary.recap.under.lead', { count: story.days }),
        t('diary.recap.under.accent', { amount: formatShort(story.spare) }),
      ];
    case 'over':
      return [
        t('diary.recap.over.lead', { amount: formatShort(story.over) }),
        t('diary.recap.over.accent'),
      ];
    case 'even':
      return [t('diary.recap.even.lead'), t('diary.recap.even.accent')];
    case 'fresh':
      return [t('diary.recap.fresh.lead'), t('diary.recap.fresh.accent')];
  }
}

/** Page one: the companion and the week's story in one sentence, its payoff in the accent. */
export function StoryPage({ story }: { readonly story: RecapStory }) {
  const { palette, serious } = useTheme();
  const { t } = useI18n();
  const [lead, accent] = storyText(story, t);
  const happy = story.kind !== 'over';
  return (
    <View style={{ flex: 1, gap: 14 }}>
      {!serious ? <Companion size={72} mood={happy ? 'happy' : 'nod'} /> : null}
      <Text style={{ ...display(31, 500, -0.02), lineHeight: 33.5, color: palette.ink }}>
        {lead}{' '}
        <Text style={{ color: serious ? palette.inkSoft : recapAccent(palette.dark) }}>
          {accent}
        </Text>
      </Text>
    </View>
  );
}

/** Page two: the week's total and a bar per day against the dashed daily line. */
export function BarsPage({
  recap,
  letters,
}: {
  readonly recap: WeekRecap;
  readonly letters: readonly string[];
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const wash = inkWash(palette.dark);
  return (
    <View style={{ flex: 1, gap: 12 }}>
      <Text style={{ ...display(24, 500), lineHeight: 26.4, color: palette.ink }}>
        {t('diary.recap.total', { total: formatShort(recap.total) })}{' '}
        <Text style={{ color: palette.inkSoft }}>
          {t('diary.recap.under', { under: recap.under, count: recap.days })}
        </Text>
      </Text>
      <View style={{ height: 140, flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <DashedRule
          color={palette.inkSoft}
          width={1.5}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${recap.lineHeight}%`,
            opacity: 0.5,
          }}
        />
        {recap.bars.map((bar, i) => (
          <View
            key={bar.day}
            style={{
              flex: 1,
              height: '100%',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 5,
              opacity: bar.value === null ? 0.5 : 1,
            }}
          >
            <Text style={{ ...body(10.5, 600), color: palette.inkSoft }}>
              {bar.value === null ? '' : formatShort(bar.value)}
            </Text>
            <View
              style={{
                width: '100%',
                height: bar.value === null ? 4 : `${bar.height}%`,
                borderRadius: 8,
                backgroundColor:
                  bar.value === null
                    ? palette.hair
                    : bar.isToday
                      ? palette.accent
                      : bar.over
                        ? wash.strongBar
                        : wash.bar,
              }}
            />
            <Text style={{ ...body(11, 600), color: palette.inkSoft }}>{letters[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Page three: the three places most of the week's money went. */
export function PlacesPage({ recap }: { readonly recap: WeekRecap }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { categories } = useMoney();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ ...display(24, 500), lineHeight: 26.4, paddingBottom: 8, color: palette.ink }}>
        {t('diary.recap.places')}
      </Text>
      {recap.places.length === 0 ? (
        <Text style={{ ...body(15), color: palette.inkSoft }}>{t('diary.recap.placesEmpty')}</Text>
      ) : null}
      {recap.places.map((place) => {
        const category = categories.find((c) => c.id === place.category);
        const icon = category && isSymbolName(category.icon) ? category.icon : 'payments';
        return (
          <View
            key={place.merchant}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
          >
            <CategoryTile
              icon={merchantIcon(place.merchant, icon)}
              hue={category?.hue ?? 80}
              size={40}
              radius={14}
              glyph={22}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text numberOfLines={1} style={{ ...body(16, 600), color: palette.ink }}>
                {place.merchant}
              </Text>
              <Text style={{ ...body(13), color: palette.inkSoft }}>
                {t('diary.places.visits', { count: place.visits })}
              </Text>
            </View>
            <Text style={{ ...display(22, 500), color: palette.ink }}>
              {formatShort(place.amount)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
