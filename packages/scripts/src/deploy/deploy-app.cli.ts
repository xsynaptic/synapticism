#!/usr/bin/env tsx
import { parseArgs } from 'node:util';

import { deployApp } from '#deploy/deploy-app.ts';
import { assertDeployAuth } from '#deploy/deploy-config.ts';
import { findWorkspaceRoot } from '#shared/utils.ts';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'dry-run': { default: false, type: 'boolean' },
	},
});

assertDeployAuth();

await deployApp({
	dryRun: values['dry-run'],
	rootPath: findWorkspaceRoot(),
});
