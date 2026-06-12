#!/usr/bin/env tsx
import { parseArgs } from 'node:util';
import { $ } from 'zx';

import { deployApp } from './deploy-app.js';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'dry-run': { default: false, type: 'boolean' },
		'root-path': { default: process.cwd(), type: 'string' },
		'skip-delete': { default: false, type: 'boolean' },
	},
});

try {
	await $`ssh-add --apple-load-keychain 2>/dev/null`;
} catch {
	// Ignore
}

await deployApp({
	dryRun: values['dry-run'],
	rootPath: values['root-path'],
	skipDelete: values['skip-delete'],
});
