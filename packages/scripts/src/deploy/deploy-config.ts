import { log, UserError } from '@xsynaptic/astro-scripts';

// Hardcoded because it never varies; must match `site` in astro.config.ts and the wrangler route
export const siteUrl = 'https://synapticism.com/';

// Without these wrangler falls back to its OAuth session, whose refresh needs a browser
// Not `CLOUDFLARE_API_TOKEN` in `.env`: cf and wrangler read that name from it and would run every command as this token
const requiredAuthEnv = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_DEPLOY_TOKEN'] as const;

const exampleEnv = [
	'Example .env:',
	'  CLOUDFLARE_ACCOUNT_ID=<account-id>',
	'  CLOUDFLARE_DEPLOY_TOKEN=<token with Workers Scripts:Edit and Workers Routes:Edit>',
];

export function getWranglerEnv() {
	return { CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_DEPLOY_TOKEN };
}

// Called before the build, so a missing token costs a second rather than surfacing minutes in
export function assertDeployAuth() {
	const missing = requiredAuthEnv.filter((name) => (process.env[name] ?? '') === '');

	if (missing.length === 0) return;

	throw new UserError(`Missing required environment variables: ${missing.join(', ')}`, {
		detail: exampleEnv.join('\n'),
	});
}

export function reportDeployConfig() {
	log.summary([
		['Target', 'Cloudflare Workers (static assets)'],
		['Site', siteUrl],
		['Auth', 'CLOUDFLARE_DEPLOY_TOKEN (.env)'],
	]);
}
