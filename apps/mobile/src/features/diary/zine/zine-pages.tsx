import { Text, View } from 'react-native';

import { CategoryTile } from '../../../ui/category-tile';
import { Companion } from '../../../ui/companion/companion';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { PaperEdge } from '../../../ui/paper-edge';
import { body, display, families, mono } from '../../../ui/type/fonts';
import { paper, zineInk } from '../diary-colours';

const label = { ...mono(11, 400, 0.16), color: zineInk.ink, opacity: 0.6 } as const;

export interface ZinePlace {
  readonly name: string;
  readonly sub: string;
  readonly amount: string;
  readonly icon: SymbolName;
  readonly hue: number;
  /** Share of the top place, 0–100. */
  readonly pct: number;
}

/** Where the month's money went: the top three places, each with a bar against the first. */
export function ZinePlaces({
  title,
  places,
}: {
  readonly title: string;
  readonly places: readonly ZinePlace[];
}) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={label}>{title}</Text>
      {places.map((p) => (
        <View key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CategoryTile icon={p.icon} hue={p.hue} size={38} radius={13} glyph={21} />
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <Text
                numberOfLines={1}
                style={{ ...body(15, 650), color: zineInk.ink, flexShrink: 1 }}
              >
                {p.name} <Text style={{ ...body(15, 500), opacity: 0.6 }}>· {p.sub}</Text>
              </Text>
              <Text style={{ ...display(19, 500), color: zineInk.ink }}>{p.amount}</Text>
            </View>
            <View style={{ height: 4, borderRadius: 4, backgroundColor: zineInk.track }}>
              <View
                style={{
                  height: '100%',
                  width: `${p.pct}%`,
                  borderRadius: 4,
                  backgroundColor: zineInk.ink,
                }}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export interface ZineTicket {
  readonly label: string;
  readonly date: string;
  readonly amount: string;
  readonly note: string | null;
}

/** A torn paper slip for the quietest or the biggest day, tilted. */
function Ticket({ ticket, tilt }: { readonly ticket: ZineTicket; readonly tilt: number }) {
  return (
    <View
      style={{
        flex: 1,
        transform: [{ rotate: `${tilt}deg` }],
        boxShadow: '0 8px 14px rgba(40,10,30,.18)',
      }}
    >
      <View
        style={{
          backgroundColor: paper.sheet,
          padding: 12,
          paddingBottom: 14,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          gap: 5,
        }}
      >
        <Text style={{ ...mono(9.5, 400, 0.14), color: paper.ink, opacity: 0.55 }}>
          {ticket.label}
        </Text>
        <Text style={{ ...mono(11, 600), color: paper.ink }}>{ticket.date}</Text>
        <Text style={{ ...display(26, 500), lineHeight: 26, paddingTop: 2, color: paper.ink }}>
          {ticket.amount}
        </Text>
        {ticket.note ? (
          <Text
            style={{
              fontFamily: families.hand,
              fontSize: 17,
              lineHeight: 17.9,
              paddingTop: 2,
              color: paper.hand,
            }}
          >
            {ticket.note}
          </Text>
        ) : null}
      </View>
      <PaperEdge color={paper.sheet} height={8} step={10} radius={4.75} />
    </View>
  );
}

export function ZineTickets({
  quiet,
  big,
}: {
  readonly quiet: ZineTicket | null;
  readonly big: ZineTicket | null;
}) {
  if (!quiet && !big) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {quiet ? <Ticket ticket={quiet} tilt={-1.5} /> : <View style={{ flex: 1 }} />}
      {big ? <Ticket ticket={big} tilt={1.5} /> : <View style={{ flex: 1 }} />}
    </View>
  );
}

export interface ZineDay {
  readonly key: string;
  readonly dow: string;
  readonly day: string;
  readonly total: string;
  readonly dot: string;
}

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

/** Every day the user closed, as little paper squares six to a row. */
export function ZineDays({
  title,
  count,
  days,
}: {
  readonly title: string;
  readonly count: string;
  readonly days: readonly ZineDay[];
}) {
  const rows = Array.from({ length: Math.ceil(days.length / 6) }, (_, r) =>
    days.slice(r * 6, r * 6 + 6),
  );
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={label}>{title}</Text>
        <Text style={label}>{count}</Text>
      </View>
      <View style={{ gap: 10 }}>
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 7 }}>
            {row.map((d, i) => (
              <View
                key={d.key}
                style={{
                  flex: 1,
                  backgroundColor: paper.sheet,
                  borderRadius: 3,
                  paddingTop: 5,
                  paddingHorizontal: 4,
                  paddingBottom: 6,
                  alignItems: 'center',
                  gap: 2,
                  transform: [{ rotate: `${TILTS[(r * 6 + i) % 6] ?? 0}deg` }],
                  boxShadow: '0 4px 8px rgba(40,10,30,.14)',
                }}
              >
                <Text style={{ ...mono(7.5, 400, 0.06), color: paper.ink, opacity: 0.55 }}>
                  {d.dow}
                </Text>
                <Text style={{ ...display(18, 500), lineHeight: 18, color: paper.ink }}>
                  {d.day}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: d.dot }} />
                  <Text style={{ ...mono(8.5, 600), color: paper.ink }}>{d.total}</Text>
                </View>
              </View>
            ))}
            {Array.from({ length: 6 - row.length }, (_, i) => (
              <View key={`gap-${i}`} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** The handwritten note taped in at the end, signed by 6pm. */
export function ZineNote({
  note,
  signoff,
  serious,
}: {
  readonly note: string;
  readonly signoff: string;
  readonly serious: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: 'center',
        width: 290,
        transform: [{ rotate: '-2deg' }],
        backgroundColor: zineInk.noteBg,
        paddingTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 16,
        boxShadow: '0 12px 24px rgba(40,10,30,.2)',
        gap: 10,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: -9,
          left: 145 - 35,
          width: 70,
          height: 18,
          transform: [{ rotate: '3deg' }],
          backgroundColor: 'rgba(255,255,255,.45)',
        }}
      />
      <Text
        style={{
          fontFamily: families.hand,
          fontSize: 25,
          lineHeight: 27.5,
          color: zineInk.noteInk,
        }}
      >
        {note}
      </Text>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}
      >
        <Text style={{ fontFamily: families.hand, fontSize: 19, color: zineInk.noteInk }}>
          {signoff}
        </Text>
        {!serious ? <Companion size={40} mood="happy" /> : null}
      </View>
    </View>
  );
}
