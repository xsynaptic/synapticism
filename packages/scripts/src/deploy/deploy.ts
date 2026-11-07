#!/usr/bin/env node
import { fetchUrl, log, runSubprocess, UserError, withStep } from '@xsynaptic/astro-scripts';

import { deployApp } from '#deploy/deploy-app.ts';
import { assertDeployAuth, reportDeployConfig, siteUrl } from '#deploy/deploy-config.ts';
import { runCommand } from '#shared/command.ts';

// A successful `wrangler deploy` is not proof the site answers; fail the run if it doesn't
async function healthCheck() {
	return withStep(
		`Health check: ${siteUrl}`,
		async () => {
			const response = await fetchUrl(siteUrl, {
				retry: { limit: 1, retryOnTimeout: true },
				throwHttpErrors: false,
				timeout: 15_000,
			});

			if (!response.ok) {
				throw new UserError(
					`Site health check failed: ${String(response.status)} ${response.statusText}`,
				);
			}

			return response.status;
		},
		(status) => `Health check: ${siteUrl} (${String(status)})`,
	);
}

await runCommand({
	name: 'deploy-site',
	options: {
		'dry-run': { default: false, description: 'Run wrangler without uploading', type: 'boolean' },
		'skip-build': {
			default: false,
			description: 'Deploy the existing dist/; implies --skip-check',
			type: 'boolean',
		},
		'skip-check': { default: false, description: 'Skip the quality gate', type: 'boolean' },
		'skip-smoke': { default: false, description: 'Skip the smoke suite', type: 'boolean' },
	},
	run: async ({ paths, rootPath, values }) => {
		const dryRun = values['dry-run'];

		assertDeployAuth();
		reportDeployConfig();

		await runSubprocess('Validating content', ['pnpm', 'validate-content'], { cwd: rootPath });

		// `pnpm build` carries no type check, so the deploy runs the gate itself
		if (values['skip-build'] || values['skip-check']) log.warn('Skipping quality gate');
		else await runSubprocess('Checking', ['pnpm', 'check'], { cwd: rootPath });

		if (values['skip-build']) log.warn('Skipping build');
		else await runSubprocess('Building', ['pnpm', 'build'], { cwd: rootPath });

		// Runs in a dry run too, since it reads the build and touches nothing remote
		if (values['skip-smoke']) log.warn('Skipping smoke suite');
		else
			await runSubprocess('Running the smoke suite', ['pnpm', 'test-e2e-smoke'], { cwd: rootPath });

		const { assets } = await deployApp({ distPath: paths.distPath, dryRun, rootPath });

		if (dryRun) {
			log.warn('Skipping health check (dry run)');
			log.data({ assets, dryRun, site: siteUrl }, () => `Dry run: ${String(assets)} assets`);
			return;
		}

		const status = await healthCheck();

		log.data(
			{ assets, dryRun, site: siteUrl, status },
			() => `Deployed ${String(assets)} assets to ${siteUrl}`,
		);
	},
	summary: 'Build, smoke-test and deploy the site to Cloudflare Workers',
	title: 'Deploy site',
});
