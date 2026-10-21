import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { CARD_FAMILIES, PRODUCT_NAME, SCENE_SCHEMA_VERSION } from '@okard/shared';
import { getServerAIStatus } from './ai.js';

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

app.notFound((c) => c.json({ error: 'NOT_FOUND', message: 'This endpoint does not exist.' }, 404));
app.onError((error, c) => {
  console.error('OKard API error', error);
  return c.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong.' }, 500);
});
