#!/usr/bin/env tsx
import type { CollectionKey } from 'astro:content';

import chalk from 'chalk';
import path from 'node:path';
import { parseArgs } from 'node:util';

import type { ValidationResult } from '#validate-content/validation-result.ts';

import { getCollectionEntries, withAstroContent } from '#shared/astro-content.ts';
import { findWorkspaceRoot } from '#shared/utils.ts';
import { validateEntryIds } from '#validate-content/entry-ids.ts';
import { validateImages } from '#validate-content/images.ts';
import { validateLinkIds } from '#validate-content/link-ids.ts';
import { validateMdxComponents } from '#validate-content/mdx.ts';
import { validateReferences } from '#validate-content/references.ts';
import { reportValidationResult } from '#validate-content/validation-result.ts';

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

// Names are the CLI subcommands; a full run reports in this order
const validations = [
	{ name: 'entry-ids', run: () => validateEntryIds(entries) },
	{ name: 'images', run: () => validateImages(entries, mediaPath) },
	{ name: 'link-ids', run: () => validateLinkIds(entries, entries, rootPath) },
	{ name: 'mdx', run: () => validateMdxComponents(entries, rootPath) },
	{ name: 'references', run: () => validateReferences(entries) },
] satisfies Array<{ name: string; run: () => ValidationResult }>;

const selected = command ? validations.filter(({ name }) => name === command) : validations;

if (command && selected.length === 0) {
	console.log(chalk.red(`Unknown command: ${command}`));
	console.log(chalk.dim(`Available: ${validations.map(({ name }) => name).join(', ')}`));
	process.exit(1);
}

let hasFailure = false;

for (const { run } of selected) {
	const result = run();

	reportValidationResult(result);

	if (result.status === 'fail') hasFailure = true;
}

// Subcommands are for inspection; only a full run sets the exit code
if (!command && hasFailure) process.exit(1);
