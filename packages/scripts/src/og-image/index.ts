#!/usr/bin/env tsx
import { openGraphBasePath, openGraphImageFormat } from '@synapticism/shared/constants';
import chalk from 'chalk';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import pLimit from 'p-limit';

import { findWorkspaceRoot } from '#shared/utils.js';

import type { OpenGraphContentEntry } from './types.js';

import { getBuiltEntries } from './built-entries.js';
import { createCardRenderer, resolveMediaPath } from './generate.js';
import { createOutputCache, getOutputCacheKey } from './output-cache.js';

// Rendering is CPU-bound and each entry decodes its own image, so one bound serves both
const concurrency = 12;

// Survives between builds, so a wiped dist costs no re-renders
const cacheDir = '.cache/og-image';

const rootPath = findWorkspaceRoot();

async function getModifiedTime(filePath: string): Promise<number | undefined> {
	try {
		const { mtimeMs } = await stat(filePath);

		return Math.round(mtimeMs);
	} catch {
		return undefined;
	}
}

async function main() {
	const cachePath = path.resolve(rootPath, cacheDir);
	const distPath = path.resolve(rootPath, 'dist');

	console.log(chalk.magenta('=== OpenGraph image generation ===\n'));

	const { entries, unresolved } = await getBuiltEntries({ distPath });

	reportUnresolved(unresolved);

	const cache = await createOutputCache(cachePath);
	const renderCard = await createCardRenderer();
	const limit = pLimit(concurrency);

	console.log(chalk.blue(`Generating ${String(entries.length)} images...\n`));

	let generated = 0;
	let reused = 0;
	const errors: Array<string> = [];
	const missingImages: Array<string> = [];

	async function renderEntry(entry: OpenGraphContentEntry): Promise<void> {
		const imageModifiedTime = entry.imageId
			? await getModifiedTime(resolveMediaPath(entry.imageId))
			: undefined;

		// Originals are gitignored, so a card can ship without its art on a partial checkout
		if (imageModifiedTime === undefined && entry.imageId) {
			missingImages.push(`${entry.outputId}: ${entry.imageId}`);
		}

		const key = getOutputCacheKey({
			digest: entry.digest,
			imageId: entry.imageId,
			imageModifiedTime,
		});

		if (await cache.isFresh(entry.outputId, key)) {
			reused += 1;
			return;
		}

		await cache.write(entry.outputId, key, await renderCard(entry));

		generated += 1;
		console.log(chalk.green(`✓ ${entry.outputId}`));
	}

	await Promise.all(
		entries.map((entry) =>
			limit(async () => {
				try {
					await renderEntry(entry);
				} catch (error) {
					errors.push(
						`${entry.outputId}: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}),
		),
	);

	await cache.save();

	console.log(chalk.gray(`\n${String(generated)} generated, ${String(reused)} cached`));

	for (const missing of missingImages) {
		console.log(chalk.yellow(`! Featured Image missing, drawn without art: ${missing}`));
	}

	for (const error of errors) {
		console.log(chalk.red(`✗ ${error}`));
	}

	if (errors.length > 0) {
		throw new Error(`${String(errors.length)} OpenGraph image(s) failed to render`);
	}

	await publish({ cache, distPath, outputIds: entries.map((entry) => entry.outputId) });
}

// Only what the build asked for ships; an orphan stays in the cache, where it costs only disk
async function publish({
	cache,
	distPath,
	outputIds,
}: {
	cache: { filePath: (outputId: string) => string };
	distPath: string;
	outputIds: Array<string>;
}): Promise<void> {
	const publishPath = path.join(distPath, openGraphBasePath);

	await mkdir(publishPath, { recursive: true });

	for (const outputId of outputIds) {
		await copyFile(
			cache.filePath(outputId),
			path.join(publishPath, `${outputId}.${openGraphImageFormat}`),
		);
	}

	console.log(chalk.gray(`Published ${String(outputIds.length)} cards to ${publishPath}`));
}

// An unresolved stem means seo.ts and this generator have diverged; the page would ship a dead og:image
function reportUnresolved(unresolved: Array<string>): void {
	if (unresolved.length === 0) return;

	for (const outputId of unresolved) {
		console.log(chalk.red(`✗ Unresolved: ${outputId}`));
	}

	throw new Error(
		`${String(unresolved.length)} card(s) referenced by the build resolve to no entry`,
	);
}

await main();
