#!/usr/bin/env node
import { log } from '@xsynaptic/astro-scripts';

import { deployApp } from '#deploy/deploy-app.ts';
import { assertDeployAuth } from '#deploy/deploy-config.ts';
import { runCommand } from '#shared/command.ts';

await runCommand({
	name: 'deploy-app',
	options: {
		'dry-run': { default: false, description: 'Run wrangler without uploading', type: 'boolean' },
	},
	run: async ({ paths, rootPath, values }) => {
		assertDeployAuth();

		const dryRun = values['dry-run'];
		const { assets } = await deployApp({ distPath: paths.distPath, dryRun, rootPath });

		log.data({ assets, dryRun }, () =>
			dryRun ? `Dry run: ${String(assets)} assets` : `Deployed ${String(assets)} assets`,
		);
	},
	summary: 'Upload the existing dist/ to Cloudflare Workers',
	title: 'Deploy app',
});
