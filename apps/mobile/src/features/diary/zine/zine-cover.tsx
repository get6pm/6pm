import { Text, View } from 'react-native';

import { body, display, leading, mono } from '../../../ui/type/fonts';
import { paper, zineInk } from '../diary-colours';

export interface ZineStat {
  readonly key: string;
  readonly value: string;
  readonly sub: string;
}

/** The zine's opening: the month in big type, its headline, the red CLOSED stamp, four stats. */
export function ZineCover({
  title,
  headline,
  closed,
  stampLabel,
  stats,
}: {
  readonly title: string;
  readonly headline: string;
  /** "27/30" */
  readonly closed: string;
  readonly stampLabel: string;
  readonly stats: readonly ZineStat[];
}) {
  return (
    <>
      <View style={{ gap: 14 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ ...leading(display(68, 500, -0.045), 61.2, true), color: zineInk.ink }}
        >
          {title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Text
            style={{
              ...leading(display(27, 500, -0.015), 29.7),
              maxWidth: 230,
              color: zineInk.ink,
            }}
          >
            {headline}
          </Text>
          <View
            style={{
              paddingTop: 6,
              paddingHorizontal: 10,
              paddingBottom: 5,
              marginBottom: 6,
              borderWidth: 2.5,
              borderColor: zineInk.stamp,
              borderRadius: 6,
              transform: [{ rotate: '8deg' }],
              mixBlendMode: 'multiply',
            }}
          >
            <Text
              style={{
                ...mono(12, 600, 0.14),
                lineHeight: 14.4,
                color: zineInk.stamp,
                textAlign: 'center',
              }}
            >
              {closed}
              {'\n'}
              {stampLabel}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stats.map((s) => (
          <View
            key={s.key}
            style={{
              width: '48.5%',
              flexGrow: 1,
              backgroundColor: paper.sheet,
              boxShadow: '0 8px 18px rgba(40,10,30,.16)',
              borderRadius: 6,
              paddingTop: 12,
              paddingHorizontal: 14,
              paddingBottom: 13,
              gap: 4,
            }}
          >
            <Text
              style={{
                ...mono(10, 400, 0.12),
                textTransform: 'uppercase',
                color: paper.ink,
                opacity: 0.55,
              }}
            >
              {s.key}
            </Text>
            <Text style={{ ...leading(display(30, 500, -0.02), 30), color: paper.ink }}>
              {s.value}
            </Text>
            <Text style={{ ...body(12.5), color: paper.ink, opacity: 0.65 }}>{s.sub}</Text>
          </View>
        ))}
      </View>
    </>
  );
}
