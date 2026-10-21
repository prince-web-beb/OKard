import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Same-origin API proxy for Replit UI+API and Netlify UI -> Replit/Cloud Run API.
 * This is deliberately not an arbitrary URL proxy: hostname comes only from
 * server-owned OKARD_API_URL. Large uploads must use signed storage URLs later.
 */
const proxy: RequestHandler = async ({ params, request, url, fetch }) => {
  const path = params.path ?? '';
  if (!/^v1\/[a-z0-9/_-]+$/i.test(path)) {
    return json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const configured = env.OKARD_API_URL?.trim();
  if (!configured && env.DEPLOY_TARGET === 'netlify') {
    return json({ error: 'API_NOT_CONFIGURED' }, { status: 503 });
  }

  let upstreamBase: URL;
  try {
    upstreamBase = new URL(configured || 'http://127.0.0.1:3001');
    if (!['https:', 'http:'].includes(upstreamBase.protocol) || upstreamBase.username || upstreamBase.password) {
      throw new Error('Invalid upstream URL');
    }
    if (upstreamBase.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(upstreamBase.hostname)) {
      throw new Error('Remote API upstream must use HTTPS.');
    }
  } catch {
    return json({ error: 'API_CONFIGURATION_ERROR' }, { status: 503 });
  }

  const destination = new URL('/api/' + path, upstreamBase);
  destination.search = url.search;
  const headers = new Headers(request.headers);
  // Forward an explicit verified bearer access token, but never forward
  // unrelated web session cookies to a separately hosted Replit/Cloud Run API.
  for (const name of ['host', 'connection', 'transfer-encoding', 'content-length', 'accept-encoding', 'origin', 'cookie', 'x-forwarded-host', 'x-forwarded-proto']) {
    headers.delete(name);
  }
  let body: ArrayBuffer | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
    if (body.byteLength > 1024 * 1024) {
      return json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    }
  }

  try {
    const response = await fetch(destination, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
    });
    const responseHeaders = new Headers(response.headers);
    for (const name of ['connection', 'transfer-encoding', 'content-length', 'content-encoding']) {
      responseHeaders.delete(name);
    }
    // Prevent an upstream external redirect from becoming an open redirect.
    if (response.status >= 300 && response.status < 400) {
      return json({ error: 'UPSTREAM_REDIRECT_BLOCKED' }, { status: 502 });
    }
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return json({ error: 'API_UNAVAILABLE', message: 'Please retry shortly.' }, { status: 503 });
  }
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
