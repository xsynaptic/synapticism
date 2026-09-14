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

type CardRenderer = Awaited<ReturnType<typeof createCardRenderer>>;

type OutputCache = Awaited<ReturnType<typeof createOutputCache>>;

interface RenderContext {
	cache: OutputCache;
	renderCard: CardRenderer;
}

interface RenderSummary {
	errors: Array<string>;
	generated: number;
	missingImages: Array<string>;
	reused: number;
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
	const cachePath = path.resolve(rootPath, cacheDir);
	const distPath = path.resolve(rootPath, 'dist');

	console.log(chalk.magenta('=== OpenGraph image generation ===\n'));

	const { entries, unresolved } = await getBuiltEntries({ distPath });

	reportUnresolved(unresolved);

	const cache = await createOutputCache(cachePath);
	const renderCard = await createCardRenderer();

	console.log(chalk.blue(`Generating ${String(entries.length)} images...\n`));

	const summary = await renderEntries(entries, { cache, renderCard });
	const pruned = await cache.prune(new Set(entries.map((entry) => entry.outputId)));

	await cache.save();

	if (pruned > 0) console.log(chalk.yellow(`Pruned ${String(pruned)} orphaned card(s)`));

	reportSummary(summary);

	await publish({ cache, distPath, outputIds: entries.map((entry) => entry.outputId) });
}

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

async function renderEntries(
	entries: Array<OpenGraphContentEntry>,
	context: RenderContext,
): Promise<RenderSummary> {
	const limit = pLimit(concurrency);
	const summary: RenderSummary = { errors: [], generated: 0, missingImages: [], reused: 0 };

	await Promise.all(
		entries.map((entry) =>
			limit(async () => {
				try {
					await renderEntry(entry, context, summary);
				} catch (error) {
					summary.errors.push(
						`${entry.outputId}: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}),
		),
	);

	return summary;
}

async function renderEntry(
	entry: OpenGraphContentEntry,
	{ cache, renderCard }: RenderContext,
	summary: RenderSummary,
): Promise<void> {
	const imageModifiedTime = entry.imageId
		? await getModifiedTime(resolveMediaPath(entry.imageId))
		: undefined;

	// Originals are gitignored, so a card can ship without its art on a partial checkout
	if (imageModifiedTime === undefined && entry.imageId) {
		summary.missingImages.push(`${entry.outputId}: ${entry.imageId}`);
	}

	const key = getOutputCacheKey({
		digest: entry.digest,
		imageId: entry.imageId,
		imageModifiedTime,
	});

	if (await cache.isFresh(entry.outputId, key)) {
		summary.reused += 1;
		return;
	}

	await cache.write(entry.outputId, key, await renderCard(entry));

	summary.generated += 1;
	console.log(chalk.green(`✓ ${entry.outputId}`));
}

function reportSummary({ errors, generated, missingImages, reused }: RenderSummary): void {
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
