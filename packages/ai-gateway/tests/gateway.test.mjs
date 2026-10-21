import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAIGateway, AIGatewayError, getAIProviderStatus, loadAIGatewayConfig,
} from '../dist/index.js';

const config = {
  openRouterKey: 'test-openrouter-key', openRouterModel: 'acme/model',
  googleKey: 'test-google-key', googleModel: 'gemini-test', enableFallback: true,
};

test('OpenRouter primary and Google secondary without leaking keys', () => {
  const status = getAIProviderStatus(config);
  assert.deepEqual(status, {
    primary: 'openrouter', secondary: 'google', primaryConfigured: true,
    secondaryConfigured: true, fallbackEnabled: true, publicAccessEnabled: false,
  });
  assert.equal(JSON.stringify(status).includes('test-openrouter-key'), false);
  assert.equal(loadAIGatewayConfig({ AI_FALLBACK_ENABLED: 'true' }).enableFallback, true);
});

test('primary success calls OpenRouter only and trims the brief', async () => {
  const calls = [];
  const gateway = createAIGateway(config, async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'Use refined lettering.' } }],
      usage: { total_tokens: 12 },
    }), { status: 200 });
  });
  const result = await gateway.suggest({ brief: '  Original elegant card  ' });
  assert.equal(result.provider, 'openrouter');
  assert.equal(result.fellBack, false);
  assert.equal(result.text, 'Use refined lettering.');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(JSON.parse(calls[0].init.body).messages.at(-1).content, 'Original elegant card');
});

test('temporary OpenRouter 429 triggers Google Gemini fallback', async () => {
  const calls = [];
  const gateway = createAIGateway(config, async (url, init) => {
    calls.push({ url, init });
    if (calls.length === 1) return new Response('{}', { status: 429 });
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Try more contrast.' }] } }],
    }), { status: 200 });
  });
  const result = await gateway.suggest({ brief: 'Suggest typography' });
  assert.equal(result.provider, 'google');
  assert.equal(result.fellBack, true);
  assert.equal(result.text, 'Try more contrast.');
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /generativelanguage.googleapis.com/);
  assert.equal(calls[1].init.headers['x-goog-api-key'], config.googleKey);
});

test('OpenRouter 401 never silently bills Google', async () => {
  let calls = 0;
  const gateway = createAIGateway(config, async () => {
    calls += 1;
    return new Response('{}', { status: 401 });
  });
  await assert.rejects(gateway.suggest({ brief: 'Brand guidelines' }),
    (error) => error instanceof AIGatewayError && error.code === 'PROVIDER_UNAUTHORIZED');
  assert.equal(calls, 1);
});

test('absent OpenRouter config never silently routes to Google', async () => {
  let calls = 0;
  const gateway = createAIGateway({ ...config, openRouterKey: undefined }, async () => {
    calls += 1;
    throw Error('not expected');
  });
  await assert.rejects(gateway.suggest({ brief: 'Original card' }),
    (error) => error.code === 'PRIMARY_NOT_CONFIGURED');
  assert.equal(calls, 0);
});

test('blank and oversized design briefs are refused before billing', async () => {
  const gateway = createAIGateway(config, async () => { throw Error('not expected'); });
  await assert.rejects(gateway.suggest({ brief: 'x'.repeat(4001) }),
    (error) => error.code === 'INVALID_REQUEST');
  await assert.rejects(gateway.suggest({ brief: '  ' }),
    (error) => error.code === 'INVALID_REQUEST');
});

test('HTTP 400 rejection does not trigger fallback', async () => {
  let calls = 0;
  const gateway = createAIGateway(config, async () => {
    calls += 1;
    return new Response('{}', { status: 400 });
  });
  await assert.rejects(gateway.suggest({ brief: 'Typography' }),
    (error) => error.code === 'PROVIDER_REJECTED');
  assert.equal(calls, 1);
});

test('malformed OpenRouter response can use configured Google fallback', async () => {
  let calls = 0;
  const gateway = createAIGateway(config, async () => {
    calls += 1;
    const raw = calls === 1 ? '{' : JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Try a cleaner layout.' }] } }],
    });
    return new Response(raw, { status: 200 });
  });
  const result = await gateway.suggest({ brief: 'Visual hierarchy' });
  assert.equal(result.provider, 'google');
  assert.equal(result.text, 'Try a cleaner layout.');
  assert.equal(calls, 2);
});
