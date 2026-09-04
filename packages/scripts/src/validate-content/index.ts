#!/usr/bin/env tsx
import type { CollectionKey } from 'astro:content';

import chalk from 'chalk';
import path from 'node:path';
import { parseArgs } from 'node:util';

import type { ValidationResult } from './validation-result.js';

import { getCollectionEntries, withAstroContent } from '../shared/astro-content.js';
import { findWorkspaceRoot } from '../shared/utils.js';
import { validateEntryIds } from './entry-ids.js';
import { validateImages } from './images.js';
import { validateLinkIds } from './link-ids.js';
import { validateMdxComponents } from './mdx.js';
import { validateReferences } from './references.js';
import { reportValidationResult } from './validation-result.js';

const collections = ['notes', 'pages', 'posts', 'projects', 'tags'] satisfies Array<CollectionKey>;

const { positionals, values } = parseArgs({
	allowPositionals: true,
	args: process.argv.slice(2),
	options: {
		'media-path': { default: 'packages/content/media', type: 'string' },
	},
});

const command = positionals[0];
const rootPath = findWorkspaceRoot();
const mediaPath = path.join(rootPath, values['media-path']);

const entries = await withAstroContent((content) => getCollectionEntries(content, collections));

const validations = {
	'entry-ids': () => validateEntryIds(entries),
	images: () => validateImages(entries, mediaPath),
	'link-ids': () => validateLinkIds(entries, rootPath),
	mdx: () => validateMdxComponents(entries, rootPath),
	references: () => validateReferences(entries),
} satisfies Record<string, () => ValidationResult>;

const selected = command
	? Object.entries(validations).filter(([name]) => name === command)
	: Object.entries(validations);

if (command && selected.length === 0) {
	console.log(chalk.red(`Unknown command: ${command}`));
	console.log(chalk.dim(`Available: ${Object.keys(validations).join(', ')}`));
	process.exit(1);
}

let hasFailure = false;

for (const [, validate] of selected) {
	const result = validate();

	reportValidationResult(result);

	if (result.status === 'fail') hasFailure = true;
}

// Subcommands are for inspection; only a full run sets the exit code
if (!command && hasFailure) process.exit(1);
