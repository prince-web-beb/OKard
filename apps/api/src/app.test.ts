import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('Hono foundation routes', () => {
  it('responds to liveness probe', async () => {
    const response = await app.request('/health/live');
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('ok');
  });
  it('exposes real catalog metadata without fake issuance', async () => {
    const response = await app.request('/api/v1/meta');
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.issuedCredentialsEnabled).toBe(false);
    expect(data.ai).toEqual({
      primary: 'openrouter',
      secondary: 'google',
      publicAccessEnabled: false,
    });
  });
  it('returns an explicit 404 error', async () => {
    const response = await app.request('/missing');
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe('NOT_FOUND');
  });
  it('provides all known design families', async () => {
    const response = await app.request('/api/v1/card-families');
    const body = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(18);
  });
  it('lists 249 ISO references without asserting official ID authority', async () => {
    const response = await app.request('/api/v1/countries');
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.total).toBe(249);
    expect(payload.officialIdentityVerification).toBe(false);
    expect(payload.items).toHaveLength(249);
  });
  it('supports localized country search and valid/invalid ISO lookups', async () => {
    const response = await app.request('/api/v1/countries?locale=fr&search=Belgique&limit=5');
    expect(response.status).toBe(200);
    expect((await response.json()).items[0].code).toBe('BE');
    expect((await app.request('/api/v1/countries/NG')).status).toBe(200);
    expect((await app.request('/api/v1/countries/ZZ')).status).toBe(404);
    expect((await app.request('/api/v1/countries?limit=0')).status).toBe(400);
  });

});
