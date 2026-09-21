#!/usr/bin/env tsx
import chalk from 'chalk';
import { parseArgs } from 'node:util';
import { $ } from 'zx';

import { deployApp } from '#deploy/deploy-app.ts';
import { assertDeployAuth, printDeployConfig, siteUrl } from '#deploy/deploy-config.ts';
import { findWorkspaceRoot } from '#shared/utils.ts';

const rootPath = findWorkspaceRoot();

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'dry-run': { default: false, type: 'boolean' },
		'skip-build': { default: false, type: 'boolean' },
		'skip-smoke': { default: false, type: 'boolean' },
	},
});

const dryRun = values['dry-run'];
const skipBuild = values['skip-build'];
const skipSmoke = values['skip-smoke'];

async function build() {
	if (skipBuild) {
		console.log(chalk.yellow('Skipping build'));
		return;
	}
	console.log(chalk.blue('Building...'));
	await $({ cwd: rootPath, stdio: 'inherit' })`pnpm build`;
}

// A successful `wrangler deploy` is not proof the site answers; fail the run if it doesn't
async function healthCheck() {
	console.log(chalk.blue(`Health check: ${siteUrl}`));

	const response = await fetch(siteUrl, { signal: AbortSignal.timeout(15_000) });

	if (!response.ok) {
		throw new Error(`Site health check failed: ${String(response.status)} ${response.statusText}`);
	}

	console.log(chalk.green(`  Site OK (${String(response.status)})`));
}

// Runs in a dry run too, since it reads the build and touches nothing remote
async function smoke() {
	if (skipSmoke) {
		console.log(chalk.yellow('Skipping smoke suite'));
		return;
	}
	console.log(chalk.blue('Running the smoke suite...'));
	await $({ cwd: rootPath, stdio: 'inherit' })`pnpm test-e2e-smoke`;
}

try {
	assertDeployAuth();
	printDeployConfig();

	await build();
	await smoke();
	await deployApp({ dryRun, rootPath });

	if (dryRun) console.log(chalk.yellow('Skipping health check (dry run)'));
	else await healthCheck();

	console.log(chalk.green('Deploy complete'));
} catch (error) {
	console.error(chalk.red('Deploy failed:'), error);
	process.exit(1);
}
