import type { CollectionKey } from 'astro:content';

import chalk from 'chalk';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { getCollectionEntries, withAstroContent } from '#shared/astro-content.js';
import { safelyCreateDirectory } from '#shared/utils.js';

interface SitemapLastmodOptions {
	outputPath: string;
	rootPath: string;
}

// Every collection that reaches a page of its own; mirrors src/content.config.ts
const sitemapCollections: Array<CollectionKey> = ['notes', 'pages', 'posts', 'projects', 'tags'];

export async function generateSitemapLastmod({
	outputPath,
	rootPath,
}: SitemapLastmodOptions): Promise<void> {
	console.log(chalk.magenta('=== Sitemap lastmod ===\n'));
	console.log(chalk.blue('Loading content...'));

	const entries = await withAstroContent((content) =>
		getCollectionEntries(content, sitemapCollections),
	);

	const urls: Record<string, string> = {};

	let missingDateCount = 0;

	for (const entry of entries) {
		const date = getEntryDate(entry.data);

		if (!date) {
			missingDateCount += 1;
			console.log(chalk.yellow(`  No date: ${entry.collection}/${entry.id}`));
			continue;
		}

		urls[getEntryPathname(entry.collection, entry.id)] = date.toISOString();
	}

	const resolvedPath = path.resolve(rootPath, outputPath);

	safelyCreateDirectory(path.dirname(resolvedPath));
	writeFileSync(
		resolvedPath,
		JSON.stringify({ generatedAt: new Date().toISOString(), urls }, undefined, 2),
	);

	console.log(chalk.green(`Resolved: ${String(Object.keys(urls).length)} URLs`));

	if (missingDateCount > 0) {
		console.log(chalk.yellow(`  ${String(missingDateCount)} entries with no frontmatter date`));
	}

	console.log(chalk.gray(`Output: ${resolvedPath}`));
}

// Frontmatter, not git history: packages/content/collections is gitignored, so there is none to read
function getEntryDate(data: Record<string, unknown>): Date | undefined {
	const date = data.dateUpdated ?? data.dateCreated;

	return date instanceof Date ? date : undefined;
}

// Mirrors getContentUrl in src/lib/utils/routing.ts; Pages are flat, every other collection is sectioned
function getEntryPathname(collection: string, id: string): string {
	return collection === 'pages' ? `/${id}/` : `/${collection}/${id}/`;
}
