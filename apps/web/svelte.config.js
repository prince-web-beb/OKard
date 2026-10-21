import adapterNode from '@sveltejs/adapter-node';
import adapterNetlify from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Replit is the primary full-stack host. Netlify is the alternate web host.
// Google Cloud Run can host the Hono API independently.
const deployTarget = process.env.DEPLOY_TARGET || 'replit';
if (!['replit', 'netlify', 'google-cloud'].includes(deployTarget)) {
  throw new Error('Invalid DEPLOY_TARGET: expected replit, netlify or google-cloud.');
}

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: deployTarget === 'netlify' ? adapterNetlify({ edge: false }) : adapterNode(),
  },
};
