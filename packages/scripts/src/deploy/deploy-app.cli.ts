#!/usr/bin/env tsx
import { parseArgs } from 'node:util';

import { deployApp } from './deploy-app.js';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'dry-run': { default: false, type: 'boolean' },
		'root-path': { default: process.cwd(), type: 'string' },
	},
});

await deployApp({
	dryRun: values['dry-run'],
	rootPath: values['root-path'],
});
