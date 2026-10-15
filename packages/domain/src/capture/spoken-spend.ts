import { VND, type Currency, type Money } from '../money/currency';
import { readSpokenNumbers, spokenAmount } from '../money/spoken-number';

/** The ids of the categories every month starts with. */
export type StarterCategoryId =
  | 'food'
  | 'drinks'
  | 'transport'
  | 'groceries'
  | 'shopping'
  | 'fun'
  | 'health'
  | 'home'
  | 'family'
  | 'gifts';

/** A spend said out loud, read into the three chips Quick add shows. */
export interface SpokenSpend {
  /** What it was, capitalised: "Trà sữa", "Veggies & eggs". Empty when only an amount was said. */
  readonly name: string;
  /** In minor units of the currency it was read in; null when no amount was said. */
  readonly amount: Money | null;
  /** The starter category the words point to, when one does. */
  readonly categoryHint: StarterCategoryId | null;
}

/**
 * Words that point to a starter category, without accents (so "pho" and "phở" both match) and
 * matched as whole words. Words that also mean something common are left out or kept only in a
 * phrase: "chợ" collides with "cho" (for), "quà" with "qua" (yesterday is "hôm qua"), "hoa" with
 * names like "Phở Hòa".
 */
const words = (list: string) => list.split(/\s*,\s*/);

const CATEGORY_WORDS: Readonly<Record<StarterCategoryId, readonly string[]>> = {
  drinks: words(
    'tra sua, tra chanh, tra da, tra dao, ca phe, caphe, cafe, coffee, cf, milk tea, ' +
      'bubble tea, boba, tea, latte, cappuccino, sinh to, smoothie, juice, nuoc ep, ' +
      'nuoc mia, bia, beer, drink, drinks, highlands, phuc long, starbucks, katinat, ' +
      'cong caphe, the coffee house, tocotoco, gong cha',
  ),
  food: words(
    'pho, bun, bun cha, bun bo, com, com tam, banh mi, banh cuon, hu tieu, mi, mien, xoi, ' +
      'an sang, an trua, an toi, breakfast, lunch, dinner, brunch, food, noodle, noodles, ' +
      'rice, pizza, burger, sushi, snack, chicken, ga ran, kfc, lotteria, jollibee, ' +
      'mcdonald, mcdonalds, texas chicken, nha hang, restaurant, quan an, grabfood, ' +
      'shopeefood, baemin',
  ),
  groceries: words(
    'di cho, o cho, tai cho, market, sieu thi, supermarket, grocery, groceries, rau, ' +
      'veggies, vegetables, egg, eggs, trung ga, trung vit, thit, meat, fish, trai cay, ' +
      'fruit, fruits, winmart, vinmart, bach hoa xanh, bhx, coopmart, co opmart, lotte mart, ' +
      'aeon, big c, mega market, emart, kingfoodmart',
  ),
  transport: words(
    'grab, grabbike, grabcar, be bike, be car, gojek, xanh sm, xanhsm, taxi, vinasun, ' +
      'mai linh, xe om, xang, petrolimex, fuel, gas, parking, gui xe, do xe, bus, xe buyt, ' +
      'metro, ve xe, uber, toll, train, flight, vietjet, vietnam airlines, bamboo airways',
  ),
  shopping: words(
    'shopee, lazada, tiki, tiktok shop, uniqlo, circle k, gs25, ministop, familymart, ' +
      '7 eleven, 7eleven, mall, vincom, shopping, quan ao, ao, giay, shoes, clothes, shirt, ' +
      'muji, zara, watsons, guardian, dien may xanh, the gioi di dong, fpt shop, cellphones',
  ),
  fun: words(
    'xem phim, rap phim, cinema, movie, movies, cgv, lotte cinema, bhd, galaxy cinema, ' +
      'karaoke, concert, game, games, bowling, bida, billiards, khu vui choi, cong vien, ' +
      'theme park, netflix, spotify, ticketbox',
  ),
  health: words(
    'nha thuoc, hieu thuoc, mua thuoc, tien thuoc, pharmacy, pharmacity, long chau, ' +
      'an khang, medicine, vitamin, vitamins, benh vien, hospital, phong kham, clinic, ' +
      'kham benh, bac si, doctor, nha khoa, dentist, vinmec, gym, yoga',
  ),
  home: words(
    'do gia dung, gia dung, noi that, furniture, ikea, sua nha, sua dien, sua nuoc, ' +
      'giat ui, giat say, laundry, don nha, don dep, cleaning, nuoc giat, nuoc rua chen, ' +
      'household, cay canh',
  ),
  family: words(
    'cho con, cho me, cho bo, bieu bo me, bieu me, gui me, hoc phi, tuition, sua bot, ' +
      'formula, bim, ta bim, diapers, do choi, toys, kids, baby, em be, tre em, con cai, ' +
      'gia dinh, family, parents, babysitter',
  ),
  gifts: words(
    'qua tang, mua qua, tang qua, qua sinh nhat, gift, gifts, present, flowers, flower, ' +
      'bo hoa, hoa tuoi, sinh nhat, birthday, li xi, mung cuoi, dam cuoi, wedding',
  ),
};

/** Lower case, accents and đ taken off, everything but letters and digits as single spaces. */
export function foldWords(text: string): string {
  const bare = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return bare === '' ? ' ' : ` ${bare} `;
}

/**
 * The starter category a merchant name or a said spend points to: the category whose word comes
 * first in the text ("trà sữa" → drinks, "Circle K" → shopping, "veggies and eggs at the market"
 * → groceries). Null when no word matches.
 */
export function categoryHintOf(text: string): StarterCategoryId | null {
  const folded = foldWords(text);
  let best: { id: StarterCategoryId; at: number; length: number } | null = null;
  for (const [id, words] of Object.entries(CATEGORY_WORDS) as [StarterCategoryId, string[]][]) {
    for (const word of words) {
      const at = folded.indexOf(` ${word} `);
      if (at < 0) continue;
      if (!best || at < best.at || (at === best.at && word.length > best.length)) {
        best = { id, at, length: word.length };
      }
    }
  }
  return best?.id ?? null;
}

const LEADING_VERB =
  /^(?:log|add|ghi|thêm|spent|i spent|paid|bought|mua|chi)\s+(?:on\s+|for\s+)?/iu;
const LINKING_BEFORE =
  /(?:^|\s)(?:for|is|was|cost|costs|about|là|hết|giá|mất|tốn|khoảng)\s*[:,]?\s*$/iu;
/** Currency words said after an amount, dropped from the name: "twelve dollars". */
const CURRENCY_AFTER =
  /^\s*(?:đồng|đ|₫|vnd|vnđ|dong|bucks|dollars?|usd|euros?|eur|pounds?|quid|yen|won|baht|ringgit|rupees?|rupiah|pesos?|francs?|kronor|krona|kroner|krone|yuan|reais|real|rand|lira|zloty|dirhams?|riyals?|dinars?)(?!\p{L})/iu;
/** Where the name stops and the place or the details start. */
const DETAIL = /\s(?:with|at|from|in|for|ở|tại|từ|cho|ngoài)\s/iu;
const EDGE_PUNCTUATION = /^[\s,.;:!?"“”'‘’()-]+|[\s,.;:!?"“”'‘’()-]+$/gu;

function nameFrom(rest: string): string {
  let s = rest.replace(/\s+/g, ' ').replace(EDGE_PUNCTUATION, '').replace(LEADING_VERB, '');
  const detail = DETAIL.exec(` ${s} `);
  if (detail) {
    const before = ` ${s} `.slice(0, detail.index).trim();
    s = before === '' ? ` ${s} `.slice(detail.index + detail[0].length).trim() : before;
  }
  s = s
    .replace(/^(?:the|a|an)\s+/i, '')
    .replace(/\s+(?:and|và)\s+/giu, ' & ')
    .replace(EDGE_PUNCTUATION, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Reads a spend said out loud: "trà sữa with pearls, forty-five k" is Trà sữa · 45.000₫ · drinks;
 * "veggies and eggs at the market, thirty-five k" is Veggies & eggs · 35.000₫ · groceries. The
 * amount is the last number said with a unit, else the last number said; the name is what is left
 * before any place or detail. Amounts are in `currency` (đồng unless told), as Quick add reads
 * them: "forty-five" is 45.000₫ in Vietnam, $45 in the US.
 */
export function parseSpokenSpend(text: string, currency: Currency = VND): SpokenSpend {
  const s = text.normalize('NFC').trim();
  const numbers = readSpokenNumbers(s);
  const spoken = [...numbers].reverse().find((n) => n.scaled) ?? numbers[numbers.length - 1];
  if (!spoken) return { name: nameFrom(s), amount: null, categoryHint: categoryHintOf(s) };
  const before = s.slice(0, spoken.start).replace(LINKING_BEFORE, ' ');
  const after = s.slice(spoken.end).replace(CURRENCY_AFTER, ' ');
  return {
    name: nameFrom(`${before} ${after}`),
    amount: spokenAmount(spoken, currency),
    categoryHint: categoryHintOf(s),
  };
}
