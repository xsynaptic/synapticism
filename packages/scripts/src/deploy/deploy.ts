#!/usr/bin/env tsx
import chalk from 'chalk';
import { parseArgs } from 'node:util';
import { $ } from 'zx';

import { deployApp } from './deploy-app.js';
import { printDeployConfig } from './deploy-config.js';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'dry-run': { default: false, type: 'boolean' },
		'root-path': { default: process.cwd(), type: 'string' },
		'skip-build': { default: false, type: 'boolean' },
	},
});

const rootPath = values['root-path'];
const dryRun = values['dry-run'];
const skipBuild = values['skip-build'];

printDeployConfig();

async function build() {
	if (skipBuild) {
		console.log(chalk.yellow('Skipping build'));
		return;
	}
	console.log(chalk.blue('Building...'));
	await $({ cwd: rootPath, stdio: 'inherit' })`pnpm astro build`;

	console.log(chalk.blue('Generating OG images...'));
	await $({
		cwd: rootPath,
		stdio: 'inherit',
	})`pnpm --filter @synapticism/scripts run og-image --root-path=${rootPath}`;
}

async function transfer() {
	await deployApp({ dryRun, rootPath });
}

try {
	await build();
	await transfer();
	console.log(chalk.green('Deploy complete'));
} catch (error) {
	console.error(chalk.red('Deploy failed:'), error);
	process.exit(1);
}
