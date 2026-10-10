import type { SymbolName } from '../../ui/icons/symbols.generated';

export interface IconPack {
  readonly name: `categories.pack.${'essentials' | 'street' | 'move' | 'home' | 'shop' | 'body' | 'out' | 'people' | 'money'}`;
  /** The hue of the pack's dot and its unselected cells. */
  readonly hue: number;
  /** Essentials is free; every other pack comes with 6pm Max. */
  readonly free: boolean;
  readonly icons: readonly SymbolName[];
}

/**
 * The category icons, in the prototype’s packs and order: 36 free, 144 more with Max. Kept six
 * to a line, as the grid draws them.
 */
// prettier-ignore
export const ICON_PACKS: readonly IconPack[] = [
  {
    name: 'categories.pack.essentials',
    hue: 40,
    free: true,
    icons: [
      'restaurant', 'local_cafe', 'lunch_dining', 'local_bar', 'shopping_cart', 'shopping_bag',
      'directions_car', 'two_wheeler', 'local_taxi', 'directions_bus', 'local_gas_station', 'home',
      'bolt', 'water_drop', 'wifi', 'smartphone', 'receipt_long', 'payments',
      'savings', 'credit_card', 'redeem', 'celebration', 'favorite', 'pets',
      'child_care', 'school', 'work', 'fitness_center', 'medical_services', 'local_pharmacy',
      'spa', 'checkroom', 'movie', 'sports_esports', 'flight', 'luggage',
    ],
  },
  {
    name: 'categories.pack.street',
    hue: 45,
    free: false,
    icons: [
      'ramen_dining', 'rice_bowl', 'bakery_dining', 'local_pizza', 'icecream', 'cake',
      'cookie', 'egg_alt', 'set_meal', 'kebab_dining', 'tapas', 'soup_kitchen',
      'emoji_food_beverage', 'coffee', 'wine_bar', 'sports_bar', 'liquor', 'fastfood',
    ],
  },
  {
    name: 'categories.pack.move',
    hue: 220,
    free: false,
    icons: [
      'electric_scooter', 'pedal_bike', 'train', 'subway', 'tram', 'directions_boat',
      'local_parking', 'ev_station', 'car_repair', 'car_rental', 'airport_shuttle', 'moped',
      'electric_moped', 'local_shipping', 'toll', 'commute', 'sailing', 'flight_takeoff',
    ],
  },
  {
    name: 'categories.pack.home',
    hue: 160,
    free: false,
    icons: [
      'chair', 'bed', 'kitchen', 'blender', 'countertops', 'light',
      'mode_fan', 'ac_unit', 'local_laundry_service', 'cleaning_services', 'plumbing', 'construction',
      'roofing', 'yard', 'potted_plant', 'router', 'tv', 'gas_meter',
    ],
  },
  {
    name: 'categories.pack.shop',
    hue: 330,
    free: false,
    icons: [
      'storefront', 'local_mall', 'sell', 'apparel', 'diamond', 'watch',
      'eyeglasses', 'face_retouching_natural', 'content_cut', 'brush', 'palette', 'local_florist',
      'toys', 'headphones', 'laptop_mac', 'devices', 'photo_camera', 'styler',
    ],
  },
  {
    name: 'categories.pack.body',
    hue: 150,
    free: false,
    icons: [
      'health_and_safety', 'vaccines', 'medication', 'dentistry', 'psychology', 'self_improvement',
      'monitor_heart', 'glucose', 'stethoscope', 'hearing', 'visibility', 'sanitizer',
      'sports_tennis', 'pool', 'hiking', 'directions_run', 'sports_soccer', 'bloodtype',
    ],
  },
  {
    name: 'categories.pack.out',
    hue: 290,
    free: false,
    icons: [
      'theater_comedy', 'music_note', 'mic', 'nightlife', 'attractions', 'casino',
      'stadium', 'festival', 'local_activity', 'confirmation_number', 'auto_stories', 'menu_book',
      'piano', 'park', 'beach_access', 'speaker', 'sports_basketball', 'kayaking',
    ],
  },
  {
    name: 'categories.pack.people',
    hue: 15,
    free: false,
    icons: [
      'family_restroom', 'stroller', 'crib', 'child_friendly', 'baby_changing_station',
      'pregnant_woman', 'escalator_warning', 'elderly', 'volunteer_activism', 'diversity_3',
      'groups', 'handshake', 'cruelty_free', 'emoji_nature', 'sound_detection_dog_barking',
      'heart_plus', 'mood', 'sentiment_very_satisfied',
    ],
  },
  {
    name: 'categories.pack.money',
    hue: 90,
    free: false,
    icons: [
      'account_balance', 'account_balance_wallet', 'currency_exchange', 'request_quote',
      'price_check', 'trending_up', 'real_estate_agent', 'receipt', 'card_giftcard',
      'featured_seasonal_and_gifts', 'temple_buddhist', 'church', 'mosque', 'paid',
      'monetization_on', 'token', 'qr_code_2', 'contactless',
    ],
  },
];

/** The eight colours a category can take, as oklch hues. */
export const CATEGORY_HUES = [25, 50, 85, 140, 200, 245, 300, 350] as const;

export const FREE_ICON_COUNT = ICON_PACKS.filter((p) => p.free).reduce(
  (n, p) => n + p.icons.length,
  0,
);
export const MAX_ICON_COUNT = ICON_PACKS.filter((p) => !p.free).reduce(
  (n, p) => n + p.icons.length,
  0,
);
