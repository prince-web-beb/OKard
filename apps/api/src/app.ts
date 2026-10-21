import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { CARD_FAMILIES, PRODUCT_NAME, SCENE_SCHEMA_VERSION } from '@okard/shared';
import { getServerAIStatus } from './ai.js';
import { getCountryReference, listCountryReferences, normalizeLocale, ISO_COUNTRY_COUNT } from '@okard/country-data';

export const app = new Hono();

app.use('*', secureHeaders());

app.get('/health/live', (c) => c.json({ status: 'ok', service: 'okard-api' }));
app.get('/health/ready', (c) =>
  c.json({
    status: 'foundation-only',
    service: 'okard-api',
    storage: 'not-connected',
    database: 'not-connected',
  }),
);

app.get('/api/v1/meta', (c) =>
  c.json({
    name: PRODUCT_NAME,
    schemaVersion: SCENE_SCHEMA_VERSION,
    stage: 'foundation',
    cardFamiliesAvailableForDesign: CARD_FAMILIES.length,
    issuedCredentialsEnabled: false,
    ai: {
      primary: getServerAIStatus().primary,
      secondary: getServerAIStatus().secondary,
      publicAccessEnabled: getServerAIStatus().publicAccessEnabled,
    },
  }),
);

app.get('/api/v1/card-families', (c) =>
  c.json({ items: CARD_FAMILIES, total: CARD_FAMILIES.length }),
);

// Public reference data: countries are context, never proof of nationality or identity.
app.get('/api/v1/countries', (c) => {
  const locale = normalizeLocale(c.req.query('locale') ?? 'en');
  const search = (c.req.query('search') ?? '').slice(0, 100).trim();
  const input = c.req.query('limit');
  const requestedLimit = input === undefined ? ISO_COUNTRY_COUNT : Number(input);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > ISO_COUNTRY_COUNT) {
    return c.json({ error: 'INVALID_LIMIT', message: 'Limit must be between 1 and 249.' }, 400);
  }
  const matches = listCountryReferences(locale, { search });
  return c.json({
    items: matches.slice(0, requestedLimit),
    total: matches.length,
    locale,
    category: 'reference-only',
    officialIdentityVerification: false,
  });
});
app.get('/api/v1/countries/:code', (c) => {
  const country = getCountryReference(c.req.param('code'), normalizeLocale(c.req.query('locale') ?? 'en'));
  return country
    ? c.json({ country, category: 'reference-only' })
    : c.json({ error: 'UNKNOWN_COUNTRY', message: 'This ISO country code is not available.' }, 404);
});

app.notFound((c) => c.json({ error: 'NOT_FOUND', message: 'This endpoint does not exist.' }, 404));
app.onError((error, c) => {
  console.error('OKard API error', error);
  return c.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong.' }, 500);
});
