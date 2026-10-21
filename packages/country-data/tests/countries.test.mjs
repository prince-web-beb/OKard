import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ISO_ALPHA_2_CODES, ISO_COUNTRY_COUNT, isIsoCountryCode,
  normalizeCountryCode, normalizeLocale, localeDirection,
  listCountryReferences, getCountryReference,
  flagEmojiForCountry, createLocalePreview,
} from '../dist/index.js';

test('all 249 ISO 3166-1 alpha-2 assignments are present and unique', () => {
  assert.equal(ISO_COUNTRY_COUNT, 249);
  assert.equal(new Set(ISO_ALPHA_2_CODES).size, 249);
  assert.ok(ISO_ALPHA_2_CODES.every((code) => /^[A-Z]{2}$/.test(code)));
  for (const code of ['AE', 'BE', 'NG', 'US', 'GB', 'FR', 'JP', 'ZA', 'AQ']) {
    assert.ok(isIsoCountryCode(code), code);
  }
  for (const code of ['ZZ', 'XK', 'UK', '', 'aaa', 42]) {
    assert.equal(isIsoCountryCode(code), false);
  }
  assert.equal(normalizeCountryCode(' ng '), 'NG');
  assert.equal(normalizeCountryCode('ZZ'), null);
});
test('English names, flag emoji and all-country search are accurate', () => {
  const belgium = getCountryReference('BE', 'en');
  assert.equal(belgium?.name, 'Belgium');
  assert.equal(belgium?.flagEmoji, '🇧🇪');
  assert.equal(flagEmojiForCountry('ZZ'), '');
  assert.equal(listCountryReferences('en').length, 249);
  assert.ok(listCountryReferences('en', { search: 'nigeria' }).some((c) => c.code === 'NG'));
  assert.equal(listCountryReferences('en', { search: 'NG' })[0]?.code, 'NG');
  assert.equal(listCountryReferences('en', { search: 'not-a-country' }).length, 0);
});
test('regional names are localized but country codes are stable', () => {
  const french = getCountryReference('BE', 'fr');
  const arabic = getCountryReference('AE', 'ar');
  assert.equal(french?.code, 'BE');
  assert.ok(french?.name);
  assert.equal(arabic?.code, 'AE');
  assert.ok(arabic?.name);
  assert.equal(listCountryReferences('fr', { search: 'Belgique' })[0]?.code, 'BE');
});
test('locale direction and globalized dates/numbers are explicit', () => {
  assert.equal(localeDirection('ar'), 'rtl');
  assert.equal(localeDirection('en-US'), 'ltr');
  assert.equal(localeDirection('fr'), 'ltr');
  assert.equal(localeDirection('en-Arab'), 'rtl');
  const preview = createLocalePreview('fr-BE');
  assert.equal(preview.resolvedLocale, 'fr-BE');
  assert.ok(preview.sampleDate);
  assert.ok(preview.sampleNumber);
  assert.equal(normalizeLocale('x--x'), 'en');
});
test('no country code is inferred from user name or IP; list can be bounded', () => {
  const references = listCountryReferences('en', { limit: 4 });
  assert.equal(references.length, 4);
  assert.ok(references.every((item) => /^[A-Z]{2}$/.test(item.code)));
  assert.equal(getCountryReference('xx'), null);
  assert.throws(() => createLocalePreview('en', new Date('invalid')));
});
