/**
 * ISO 3166-1 alpha-2 country and territory REFERENCE codes.
 * Static list: 249 official alpha-2 assignments, checked against pycountry ISO snapshot.
 * Names come from the browser/Node built-in Intl.DisplayNames in the requested locale.
 * Do NOT interpret country selection as citizenship, official identity or issuer authority.
 */
export const ISO_ALPHA_2_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`.trim().split(/\s+/) as readonly string[];

const codeSet: ReadonlySet<string> = new Set(ISO_ALPHA_2_CODES);
export const ISO_COUNTRY_COUNT = ISO_ALPHA_2_CODES.length;
export type TextDirection = 'ltr' | 'rtl';
export interface CountryReference {
  code: string;
  name: string;
  englishName: string;
  flagEmoji: string;
}
export interface LocalePreview {
  requestedLocale: string;
  resolvedLocale: string;
  direction: TextDirection;
  sampleDate: string;
  sampleNumber: string;
}

export function isIsoCountryCode(input: unknown): input is string {
  return typeof input === 'string' && input.length === 2 && codeSet.has(input);
}
export function normalizeCountryCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const normalized = input.trim().toUpperCase();
  return isIsoCountryCode(normalized) ? normalized : null;
}
export function normalizeLocale(input: unknown, fallback = 'en'): string {
  if (typeof input !== 'string' || input.length < 2 || input.length > 48 ||
    !/^[a-zA-Z0-9-]+$/.test(input)) return fallback;
  try {
    const locales = Intl.getCanonicalLocales(input);
    return locales[0] ?? fallback;
  } catch {
    return fallback;
  }
}
export function localeDirection(locale: string): TextDirection {
  const normalized = normalizeLocale(locale);
  const script = normalized.split('-').find((part) => /^(Arab|Hebr|Thaa|Syrc|Nkoo|Adlm)$/i.test(part));
  if (script) return 'rtl';
  const base = normalized.split('-')[0]?.toLowerCase() ?? 'en';
  return new Set(['ar', 'fa', 'he', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ckb']).has(base) ? 'rtl' : 'ltr';
}
export function flagEmojiForCountry(code: string): string {
  if (!isIsoCountryCode(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
function accentFold(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en');
}
function regionNames(locale: string): Intl.DisplayNames {
  return new Intl.DisplayNames([normalizeLocale(locale)], { type: 'region', fallback: 'code' });
}
const englishRegionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'code' });

/** Stable, localized, data-driven country references with no copied ID artwork. */
export function listCountryReferences(
  locale = 'en',
  options: { search?: string; limit?: number } = {},
): CountryReference[] {
  const displayNames = regionNames(locale);
  const query = accentFold((options.search ?? '').trim().slice(0, 100));
  const limit = Math.max(1, Math.min(249,
    Number.isInteger(options.limit) ? (options.limit as number) : ISO_COUNTRY_COUNT));
  return ISO_ALPHA_2_CODES
    .map((code) => ({
      code,
      name: displayNames.of(code) ?? code,
      englishName: englishRegionNames.of(code) ?? code,
      flagEmoji: flagEmojiForCountry(code),
    }))
    .filter((item) => !query || accentFold(item.name).includes(query) ||
      accentFold(item.englishName).includes(query) ||
      item.code.toLowerCase() === query)
    .sort((a, b) => a.name.localeCompare(b.name, normalizeLocale(locale), { sensitivity: 'base' }))
    .slice(0, limit);
}
export function getCountryReference(code: string, locale = 'en'): CountryReference | null {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return null;
  return {
    code: normalized,
    name: regionNames(locale).of(normalized) ?? normalized,
    englishName: englishRegionNames.of(normalized) ?? normalized,
    flagEmoji: flagEmojiForCountry(normalized),
  };
}

/**
 * Format preview respects chosen locale, not presumed nationality or timezone.
 * A known UTC time is used so screenshots/tests do not depend on user location.
 */
export function createLocalePreview(
  locale: string,
  exampleDate = new Date('2026-06-27T12:00:00.000Z'),
): LocalePreview {
  const resolvedLocale = normalizeLocale(locale);
  if (Number.isNaN(exampleDate.getTime())) throw new Error('Invalid locale preview date');
  return {
    requestedLocale: locale,
    resolvedLocale,
    direction: localeDirection(resolvedLocale),
    sampleDate: new Intl.DateTimeFormat(resolvedLocale, {
      dateStyle: 'long', timeZone: 'UTC',
    }).format(exampleDate),
    sampleNumber: new Intl.NumberFormat(resolvedLocale, {
      maximumFractionDigits: 2, minimumFractionDigits: 2,
    }).format(12345.67),
  };
}
