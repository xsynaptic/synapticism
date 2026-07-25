#!/usr/bin/env tsx
import chalk from 'chalk';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { ASTRO_CACHE_DIR, MEDIA_DIR } from './constants.js';
import { getOgImageEntries } from './content.js';
import { loadOgFonts } from './fonts.js';
import { createGenerator } from './generate.js';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'data-store-path': { default: path.join(ASTRO_CACHE_DIR, 'data-store.json'), type: 'string' },
		'media-path': { default: MEDIA_DIR, type: 'string' },
		'output-path': { default: 'dist/og', type: 'string' },
		'root-path': { default: process.cwd(), type: 'string' },
	},
});

async function main() {
	const rootPath = values['root-path'];
	const dataStorePath = path.resolve(rootPath, values['data-store-path']);
	const mediaPath = path.resolve(rootPath, values['media-path']);
	const outputPath = path.resolve(rootPath, values['output-path']);

	console.log(chalk.magenta('=== OpenGraph image generation ===\n'));

	const entries = getOgImageEntries({ dataStorePath, mediaPath });

	console.log(chalk.blue('Loading fonts...'));

	const fonts = await loadOgFonts();
	const generate = createGenerator(fonts);

	console.log(chalk.blue(`Generating ${String(entries.length)} images...\n`));

	for (const entry of entries) {
		const filePath = path.join(outputPath, entry.collection, `${entry.id}.jpg`);

		await mkdir(path.dirname(filePath), { recursive: true });
		await writeFile(filePath, await generate(entry));

		console.log(
			chalk.green(`✓ ${entry.collection}/${entry.id}`) +
				(entry.imagePath ? chalk.gray(' (with image)') : ''),
		);
	}

	console.log(chalk.gray(`\nOutput: ${outputPath}`));
}

await main();
