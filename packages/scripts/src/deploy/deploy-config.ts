import chalk from 'chalk';

// Hardcoded because it never varies; must match `site` in astro.config.ts and the wrangler route
export const siteUrl = 'https://synapticism.com/';

// Without these wrangler falls back to its OAuth session, whose refresh needs a browser
const requiredAuthEnv = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'] as const;

const exampleEnv = [
	'  .env:',
	'    CLOUDFLARE_ACCOUNT_ID=<account-id>',
	'    CLOUDFLARE_API_TOKEN=<token with Workers Scripts:Edit and Workers Routes:Edit>',
];

// Called before the build, so a missing token costs a second rather than surfacing minutes in
export function assertDeployAuth() {
	const missing: Array<string> = [];

	for (const name of requiredAuthEnv) {
		const value = process.env[name];

		if (!value) missing.push(name);
	}

	if (missing.length === 0) return;

	const message = `Missing required environment variables: ${missing.join(', ')}`;

	console.error(chalk.red(message));
	console.error(chalk.gray('\nExample configuration:'));
	for (const line of exampleEnv) console.error(chalk.gray(line));

	throw new Error(message);
}

export function printDeployConfig() {
	console.log(chalk.blue('Deploy: Cloudflare Workers (static assets)'));
	console.log(chalk.gray(`  Site: ${siteUrl}`));
	console.log(chalk.gray('  Auth: CLOUDFLARE_API_TOKEN (.env)'));
	console.log('');
}
