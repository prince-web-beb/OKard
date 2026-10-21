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
});
