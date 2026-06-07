#!/usr/bin/env tsx
import chalk from 'chalk';
import { parseArgs } from 'node:util';
import { $ } from 'zx';

import { deployApp } from './deploy-app.js';
import { loadDeployConfig, printDeployConfig } from './deploy-config.js';

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

// Load and validate deploy configuration
const config = loadDeployConfig();

printDeployConfig(config);

try {
	await $`ssh-add --apple-load-keychain 2>/dev/null`;
} catch {
	// Ignore
}

async function build() {
	if (skipBuild) {
		console.log(chalk.yellow('Skipping build'));
		return;
	}
	console.log(chalk.blue('Building...'));
	await $({ cwd: rootPath, stdio: 'inherit' })`pnpm astro build`;
}

async function transfer() {
	await deployApp({ dryRun, rootPath, skipDelete: skipBuild });
}

try {
	await build();
	await transfer();
	console.log(chalk.green('Deploy complete'));
} catch (error) {
	console.error(chalk.red('Deploy failed:'), error);
	process.exit(1);
}
