import { serve } from '@hono/node-server';
import { app } from './app.js';

const raw = process.env.API_PORT ?? process.env.PORT ?? '3001';
const port = Number(raw);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT (or PORT) must be a valid TCP port number.');
}
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.info('OKard API listening on port ' + info.port);
});
