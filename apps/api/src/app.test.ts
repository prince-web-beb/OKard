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
  it('never permits anonymous cloud project CRUD', async () => {
    const response = await app.request('/api/v1/cloud/projects');
    // 503 when cloud is feature-gated, 401 when real OIDC is provisioned.
    expect([401,503]).toContain(response.status);
    expect(response.status).not.toBe(200);
    expect(response.status).not.toBe(201);
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

  it('exposes 18 distinct family templates with no activated credential claims', async () => {
    const response = await app.request('/api/v1/templates');
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.total).toBe(18);
    expect(body.coverage.complete).toBe(true);
    expect(body.issuedCredentialsEnabled).toBe(false);
    expect(new Set(body.items.map((t: { family: string }) => t.family)).size).toBe(18);
  });
  it('filters templates and rejects unknown families or template identifiers', async () => {
    const response = await app.request('/api/v1/templates?family=events&search=summit');
    const body = await response.json();
    expect(body.total).toBe(1);
    expect(body.items[0].family).toBe('events');
    expect((await app.request('/api/v1/templates?family=invalid')).status).toBe(400);
    expect((await app.request('/api/v1/templates/studio-identity')).status).toBe(200);
    expect((await app.request('/api/v1/templates/unknown')).status).toBe(404);
  });

});
