/**
 * The time zones of each country 6pm has a currency for (`countries.ts`), from the IANA time zone
 * database's `zone.tab`, with older names a phone may still report (`Asia/Saigon`). A phone that
 * sets its clock by where it is names the zone it is in, so the zone tells the country without a
 * location fix: Bangkok and Hanoi share UTC+7, but not `Asia/Bangkok`.
 */
const ZONES_BY_COUNTRY: Readonly<Record<string, string>> = {
  VN: 'Asia/Ho_Chi_Minh Asia/Saigon',
  TH: 'Asia/Bangkok',
  SG: 'Asia/Singapore',
  MY: 'Asia/Kuala_Lumpur Asia/Kuching',
  KH: 'Asia/Phnom_Penh',
  LA: 'Asia/Vientiane',
  ID: 'Asia/Jakarta Asia/Pontianak Asia/Makassar Asia/Jayapura',
  PH: 'Asia/Manila',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  CN: 'Asia/Shanghai Asia/Urumqi',
  TW: 'Asia/Taipei',
  HK: 'Asia/Hong_Kong',
  US:
    'America/New_York America/Detroit America/Kentucky/Louisville America/Kentucky/Monticello ' +
    'America/Indiana/Indianapolis America/Indiana/Vincennes America/Indiana/Winamac ' +
    'America/Indiana/Marengo America/Indiana/Petersburg America/Indiana/Vevay America/Chicago ' +
    'America/Indiana/Tell_City America/Indiana/Knox America/Menominee ' +
    'America/North_Dakota/Center America/North_Dakota/New_Salem America/North_Dakota/Beulah ' +
    'America/Denver America/Boise America/Phoenix America/Los_Angeles America/Anchorage ' +
    'America/Juneau America/Sitka America/Metlakatla America/Yakutat America/Nome ' +
    'America/Adak Pacific/Honolulu',
  PR: 'America/Puerto_Rico',
  GU: 'Pacific/Guam',
  VI: 'America/St_Thomas',
  AS: 'Pacific/Pago_Pago',
  MP: 'Pacific/Saipan',
  EC: 'America/Guayaquil Pacific/Galapagos',
  SV: 'America/El_Salvador',
  TL: 'Asia/Dili',
  FM: 'Pacific/Chuuk Pacific/Pohnpei Pacific/Kosrae',
  MH: 'Pacific/Majuro Pacific/Kwajalein',
  PW: 'Pacific/Palau',
  AU:
    'Australia/Lord_Howe Antarctica/Macquarie Australia/Hobart Australia/Melbourne ' +
    'Australia/Sydney Australia/Broken_Hill Australia/Brisbane Australia/Lindeman ' +
    'Australia/Adelaide Australia/Darwin Australia/Perth Australia/Eucla',
  AT: 'Europe/Vienna',
  BE: 'Europe/Brussels',
  BG: 'Europe/Sofia',
  HR: 'Europe/Zagreb',
  CY: 'Asia/Nicosia Asia/Famagusta',
  EE: 'Europe/Tallinn',
  FI: 'Europe/Helsinki',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin Europe/Busingen',
  GR: 'Europe/Athens',
  IE: 'Europe/Dublin',
  IT: 'Europe/Rome',
  LV: 'Europe/Riga',
  LT: 'Europe/Vilnius',
  LU: 'Europe/Luxembourg',
  MT: 'Europe/Malta',
  NL: 'Europe/Amsterdam',
  PT: 'Europe/Lisbon Atlantic/Madeira Atlantic/Azores',
  SK: 'Europe/Bratislava',
  SI: 'Europe/Ljubljana',
  ES: 'Europe/Madrid Africa/Ceuta Atlantic/Canary',
  AD: 'Europe/Andorra',
  MC: 'Europe/Monaco',
  SM: 'Europe/San_Marino',
  VA: 'Europe/Vatican',
  ME: 'Europe/Podgorica',
  GB: 'Europe/London',
  CH: 'Europe/Zurich',
  LI: 'Europe/Vaduz',
  CA:
    'America/St_Johns America/Halifax America/Glace_Bay America/Moncton America/Goose_Bay ' +
    'America/Blanc-Sablon America/Toronto America/Iqaluit America/Atikokan America/Winnipeg ' +
    'America/Resolute America/Rankin_Inlet America/Regina America/Swift_Current ' +
    'America/Edmonton America/Cambridge_Bay America/Inuvik America/Vancouver America/Creston ' +
    'America/Dawson_Creek America/Fort_Nelson America/Whitehorse America/Dawson',
  NZ: 'Pacific/Auckland Pacific/Chatham',
  MM: 'Asia/Yangon Asia/Rangoon',
  IN: 'Asia/Kolkata Asia/Calcutta',
  PK: 'Asia/Karachi',
  LK: 'Asia/Colombo',
  NP: 'Asia/Kathmandu Asia/Katmandu',
  BD: 'Asia/Dhaka',
  AE: 'Asia/Dubai',
  SA: 'Asia/Riyadh',
  QA: 'Asia/Qatar',
  KW: 'Asia/Kuwait',
  BH: 'Asia/Bahrain',
  OM: 'Asia/Muscat',
  JO: 'Asia/Amman',
  IL: 'Asia/Jerusalem',
  TR: 'Europe/Istanbul Asia/Istanbul',
  EG: 'Africa/Cairo',
  MA: 'Africa/Casablanca',
  TN: 'Africa/Tunis',
  ZA: 'Africa/Johannesburg',
  NG: 'Africa/Lagos',
  KE: 'Africa/Nairobi',
  GH: 'Africa/Accra',
  MX:
    'America/Mexico_City America/Cancun America/Merida America/Monterrey America/Matamoros ' +
    'America/Chihuahua America/Ciudad_Juarez America/Ojinaga America/Mazatlan ' +
    'America/Bahia_Banderas America/Hermosillo America/Tijuana',
  BR:
    'America/Noronha America/Belem America/Fortaleza America/Recife America/Araguaina ' +
    'America/Maceio America/Bahia America/Sao_Paulo America/Campo_Grande America/Cuiaba ' +
    'America/Santarem America/Porto_Velho America/Boa_Vista America/Manaus America/Eirunepe ' +
    'America/Rio_Branco',
  AR:
    'America/Argentina/Buenos_Aires America/Argentina/Cordoba America/Argentina/Salta ' +
    'America/Argentina/Jujuy America/Argentina/Tucuman America/Argentina/Catamarca ' +
    'America/Argentina/La_Rioja America/Argentina/San_Juan America/Argentina/Mendoza ' +
    'America/Argentina/San_Luis America/Argentina/Rio_Gallegos America/Argentina/Ushuaia ' +
    'America/Buenos_Aires',
  CL: 'America/Santiago America/Coyhaique America/Punta_Arenas Pacific/Easter',
  CO: 'America/Bogota',
  PE: 'America/Lima',
  UY: 'America/Montevideo',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  IS: 'Atlantic/Reykjavik',
  PL: 'Europe/Warsaw',
  CZ: 'Europe/Prague',
  HU: 'Europe/Budapest',
  RO: 'Europe/Bucharest',
  RS: 'Europe/Belgrade',
  UA: 'Europe/Simferopol Europe/Kyiv Europe/Kiev',
  RU:
    'Europe/Kaliningrad Europe/Moscow Europe/Kirov Europe/Volgograd Europe/Astrakhan ' +
    'Europe/Saratov Europe/Ulyanovsk Europe/Samara Asia/Yekaterinburg Asia/Omsk ' +
    'Asia/Novosibirsk Asia/Barnaul Asia/Tomsk Asia/Novokuznetsk Asia/Krasnoyarsk Asia/Irkutsk ' +
    'Asia/Chita Asia/Yakutsk Asia/Khandyga Asia/Vladivostok Asia/Ust-Nera Asia/Magadan ' +
    'Asia/Sakhalin Asia/Srednekolymsk Asia/Kamchatka Asia/Anadyr',
  KZ: 'Asia/Almaty Asia/Qyzylorda Asia/Qostanay Asia/Aqtobe Asia/Aqtau Asia/Atyrau Asia/Oral',
  UZ: 'Asia/Samarkand Asia/Tashkent',
  GE: 'Asia/Tbilisi',
  IR: 'Asia/Tehran',
  IQ: 'Asia/Baghdad',
};

const ZONE_COUNTRY: ReadonlyMap<string, string> = new Map(
  Object.entries(ZONES_BY_COUNTRY).flatMap(([country, zones]) =>
    zones.split(' ').map((zone) => [zone, country] as const),
  ),
);

/**
 * The country an IANA time zone is in (`Asia/Bangkok` → `TH`), or null for a zone 6pm cannot
 * place (`UTC`, or a country 6pm has no currency for).
 */
export function countryOfTimeZone(zone: string | null | undefined): string | null {
  return zone ? (ZONE_COUNTRY.get(zone) ?? null) : null;
}
