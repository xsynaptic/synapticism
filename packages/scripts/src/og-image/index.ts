#!/usr/bin/env tsx
import chalk from 'chalk';
import { cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

import type { ImageBatch } from './batch.js';
import type { OgImageEntry } from './content.js';
import type { ProcessedImage } from './generate.js';

import { batchEntriesBySourceImage } from './batch.js';
import { astroCacheDir, mediaDir, ogLedgerPath, ogTemplateVersion } from './constants.js';
import { getOgImageEntries } from './content.js';
import { loadOgFonts } from './fonts.js';
import { createRenderer, processImage } from './generate.js';
import { createOutputCache, getOutputCacheKey } from './output-cache.js';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'cache-path': { default: '.cache/og', type: 'string' },
		'data-store-path': { default: path.join(astroCacheDir, 'data-store.json'), type: 'string' },
		'media-path': { default: mediaDir, type: 'string' },
		'output-path': { default: 'dist/og', type: 'string' },
		'root-path': { default: process.cwd(), type: 'string' },
	},
});

function getEntryId(entry: OgImageEntry): string {
	return `${entry.collection}/${entry.id}`;
}

async function getModifiedTime(filePath: string): Promise<number | undefined> {
	try {
		const { mtimeMs } = await stat(filePath);

		return Math.round(mtimeMs);
	} catch {
		return undefined;
	}
}

async function main() {
	const rootPath = values['root-path'];
	const cachePath = path.resolve(rootPath, values['cache-path']);
	const dataStorePath = path.resolve(rootPath, values['data-store-path']);
	const ledgerPath = path.resolve(rootPath, ogLedgerPath);
	const mediaPath = path.resolve(rootPath, values['media-path']);
	const outputPath = path.resolve(rootPath, values['output-path']);

	console.log(chalk.magenta('=== OpenGraph image generation ===\n'));

	const entries = getOgImageEntries({ dataStorePath, mediaPath });
	const batches = batchEntriesBySourceImage(entries);
	const cache = await createOutputCache({
		dir: cachePath,
		ledgerPath,
		version: ogTemplateVersion,
	});

	console.log(chalk.blue('Loading fonts...'));

	const renderCard = createRenderer(await loadOgFonts());

	console.log(
		chalk.blue(
			`Generating ${String(entries.length)} images from ${String(batches.length)} source images...\n`,
		),
	);

	let generated = 0;
	let reused = 0;

	// Nothing stale in a batch means its source image is never decoded
	async function selectStale(batch: ImageBatch) {
		const imageModifiedTime = batch.imageId
			? await getModifiedTime(path.join(mediaPath, batch.imageId))
			: undefined;
		const stale: Array<OgImageEntry> = [];

		for (const entry of batch.entries) {
			const key = getOutputCacheKey({
				digest: entry.digest,
				imageId: batch.imageId,
				imageModifiedTime,
			});

			if (await cache.isFresh(getEntryId(entry), key)) {
				reused += 1;
				continue;
			}

			stale.push(entry);
		}

		return stale;
	}

	for (const batch of batches) {
		const stale = await selectStale(batch);

		if (stale.length === 0) continue;

		let image: ProcessedImage | undefined;

		if (batch.imageId) {
			image = await processImage(path.join(mediaPath, batch.imageId));
		}

		for (const entry of stale) {
			await cache.write(getEntryId(entry), await renderCard(entry, image));

			generated += 1;
			console.log(
				chalk.green(`✓ ${getEntryId(entry)}`) + (batch.imageId ? chalk.gray(' (with image)') : ''),
			);
		}
	}

	// The whole store ships, cards for retired ids included, so a published OG path never 404s
	await cp(cachePath, outputPath, { recursive: true });
	await cache.save();

	console.log(chalk.gray(`\n${String(generated)} generated, ${String(reused)} cached`));
	console.log(chalk.gray(`Output: ${outputPath}`));
}

await main();
