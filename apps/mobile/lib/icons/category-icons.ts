import type { icons } from 'lucide-react-native'

export const CATEGORY_EXPENSE_ICONS: Array<keyof typeof icons> = [
  'Banana',
  'ChefHat',
  'Apple',
  'Beef',
  'Cake',
  'Citrus',
  'Cherry',
  'Croissant',
  'CupSoda',
  'Drumstick',
  'Salad',
  'Coffee',
  'Popcorn',
  'Sandwich',
  'Utensils',
  'Pizza',
  'Wine',
  'Armchair',
  'Lamp',
  'BedDouble',
  'Drill',
  'House',
  'Refrigerator',
  'Cat',
  'Bird',
  'Dog',
  'Rabbit',
  'Fish',
  'Turtle',
  'Shirt',
  'ShoppingBasket',
  'Luggage',
  'Plane',
  'TentTree',
  'CarFront',
  'CarTaxiFront',
  'Ship',
  'TrainFront',
  'Dumbbell',
  'Pill',
  'Hospital',
  'Stethoscope',
  'Ribbon',
  'Cannabis',
  'Sprout',
  'Flower2',
  'TreePalm',
  'CircleHelp',
]

export const CATEGORY_INCOME_ICONS: Array<keyof typeof icons> = [
  'CircleHelp',
  'WalletMinimal',
  'Coins',
  'Banknote',
  'Bitcoin',
  'CreditCard',
  'Gem',
  'HandCoins',
  'Handshake',
  'PiggyBank',
  'SmartphoneNfc',
  'BadgePercent',
  'Trophy',
  'Clover',
  'ChartLine',
  'Store',
  'BriefcaseBusiness',
  'Building2',
].reverse() as Array<keyof typeof icons>

export const TRANSACTION_ICONS: Record<string, keyof typeof icons> = {
  'Initial balance': 'WalletMinimal',
  'Adjust balance': 'TrendingUp',
}
