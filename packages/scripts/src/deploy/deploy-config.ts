import chalk from 'chalk';

type AuthMode = 'interactive' | 'token';

// Hardcoded because it never varies; must match `site` in astro.config.ts and the wrangler route
export const siteUrl = 'https://synapticism.com/';

export function printDeployConfig() {
	console.log(chalk.blue('Deploy: Cloudflare Workers (static assets)'));
	console.log(chalk.gray(`  Site: ${siteUrl}`));
	console.log(
		chalk.gray(
			getDeployAuthMode() === 'token'
				? '  Auth: CLOUDFLARE_API_TOKEN (env)'
				: '  Auth: wrangler login session (run `pnpm exec wrangler login` if deploy fails)',
		),
	);
	console.log('');
}

// wrangler resolves auth itself (env token or login session), so we don't gate on it here
function getDeployAuthMode(): AuthMode {
	return process.env.CLOUDFLARE_API_TOKEN ? 'token' : 'interactive';
}
