import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { CARD_FAMILIES, PRODUCT_NAME, SCENE_SCHEMA_VERSION } from '@okard/shared';
import { getServerAIStatus } from './ai.js';
import { getCountryReference, listCountryReferences, normalizeLocale, ISO_COUNTRY_COUNT } from '@okard/country-data';
import { getTemplate, listTemplates, getTemplateFamilyCoverage } from '@okard/templates';
import { createCloudProjectRoutes, createOIDCVerifier } from './cloud-projects.js';
import { createCloudPool, createPostgresProjectStore } from './cloud-project-store.js';

export const app = new Hono();

app.use('*', secureHeaders());

app.get('/health/live', (c) => c.json({ status: 'ok', service: 'okard-api' }));
let cloudHealthPool: ReturnType<typeof createCloudPool> | null = null;
app.get('/health/ready', async (c) => {
  if (!cloudHealthPool) {
    return c.json({
      status: 'foundation-only', service: 'okard-api',
      cloudProjects: 'disabled', database: 'not-connected',
    });
  }
  try {
    // Fail readiness when schema migration has not been applied.
    await cloudHealthPool.query('SELECT id FROM okard_cloud_projects LIMIT 0');
    return c.json({
      status: 'cloud-storage-connected', service: 'okard-api',
      cloudProjects: 'configured', database: 'connected',
      note: 'Provider login, issuer keys and browser sync require separate end-to-end validation.',
    });
  } catch {
    return c.json({
      status: 'not-ready', service: 'okard-api',
      cloudProjects: 'configured', database: 'unavailable',
    },503);
  }
});

app.get('/api/v1/meta', (c) =>
  c.json({
    name: PRODUCT_NAME,
    schemaVersion: SCENE_SCHEMA_VERSION,
    stage: 'foundation',
    cardFamiliesAvailableForDesign: CARD_FAMILIES.length,
    countryReferencesAvailable: ISO_COUNTRY_COUNT,
    issuedCredentialsEnabled: false,
    cloudProjectApiConfigured: cloudReady,
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

// Catalog responses expose non-sensitive design metadata only; no user photos.
app.get('/api/v1/templates', (c) => {
  const familyRaw = c.req.query('family');
  const validFamily = familyRaw === undefined || familyRaw === 'all' ||
    CARD_FAMILIES.some((entry) => entry.id === familyRaw);
  if (!validFamily) {
    return c.json({ error: 'UNKNOWN_CARD_FAMILY', message: 'Unknown card family.' }, 400);
  }
  const search = (c.req.query('search') ?? '').slice(0, 90);
  const records = listTemplates({
    family: (familyRaw ?? 'all') as Parameters<typeof listTemplates>[0]['family'],
    search,
  });
  return c.json({
    items: records, total: records.length,
    coverage: getTemplateFamilyCoverage(),
    issuedCredentialsEnabled: false,
  });
});
app.get('/api/v1/templates/:id', (c) => {
  const template = getTemplate(c.req.param('id'));
  return template
    ? c.json({ template, issuedCredentialsEnabled: false })
    : c.json({ error: 'UNKNOWN_TEMPLATE', message: 'Template not found.' }, 404);
});

/**
 * Cloud design synchronization has NO anonymous fallback.
 * Only enabled when a trusted external OIDC issuer, its HTTPS JWKS and the
 * PostgreSQL database have been explicitly configured in server secrets.
 * No password handling, mock users or unsigned token modes are exposed.
 */
const cloudConfig = {
  issuer: process.env.OKARD_OIDC_ISSUER?.trim() ?? '',
  audience: process.env.OKARD_OIDC_AUDIENCE?.trim() ?? '',
  jwksUrl: process.env.OKARD_OIDC_JWKS_URL?.trim() ?? '',
  databaseUrl: process.env.DATABASE_URL?.trim() ?? '',
};
const cloudReady = process.env.OKARD_CLOUD_PROJECTS_ENABLED === 'true' &&
  Boolean(cloudConfig.issuer && cloudConfig.audience &&
    cloudConfig.jwksUrl && cloudConfig.databaseUrl);
if (cloudReady) {
  const verifier = createOIDCVerifier(cloudConfig);
  const database = createCloudPool(cloudConfig.databaseUrl, {
    ca: process.env.OKARD_DATABASE_CA_CERT,
  });
  cloudHealthPool = database;
  const store = createPostgresProjectStore(database);
  app.route('/api/v1/cloud/projects',createCloudProjectRoutes({
    store,verifyToken:verifier,
  }));
} else {
  const disabled = (c: import('hono').Context) => c.json({
    error: 'CLOUD_NOT_CONFIGURED',
    message: 'Cloud projects are not enabled on this deployment.',
  },503);
  app.all('/api/v1/cloud/projects',disabled);
  app.all('/api/v1/cloud/projects/*',disabled);
}

app.notFound((c) => c.json({ error: 'NOT_FOUND', message: 'This endpoint does not exist.' }, 404));
app.onError((error, c) => {
  console.error('OKard API error', error);
  return c.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong.' }, 500);
});
