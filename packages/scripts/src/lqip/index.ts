#!/usr/bin/env tsx
import chalk from 'chalk';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { glob } from 'zx';

const lqipPixelCount = 512;
const lqipWebpQuality = 25;

// Saturation lift compensates for the desaturation heavy webp compression introduces
const lqipSaturation = 1.2;

interface LqipEntry {
	lqip: string;
	mtime: number;
}

type LqipMap = Record<string, LqipEntry>;

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		'media-path': { default: 'packages/content/media', type: 'string' },
		'output-path': { default: '.cache/media-lqip.json', type: 'string' },
		'root-path': { default: process.cwd(), type: 'string' },
	},
});

async function generateLqip(filePath: string): Promise<string> {
	const image = sharp(filePath, { failOn: 'error' });
	const metadata = await image.metadata();
	const aspectRatio = metadata.width / metadata.height;
	const { height, width } = getPlaceholderDimensions(aspectRatio);

	const buffer = await image
		.resize(width, height, { fit: 'fill' })
		.modulate({ saturation: lqipSaturation })
		.webp({ quality: lqipWebpQuality })
		.toBuffer();

	return `data:image/webp;base64,${buffer.toString('base64')}`;
}

function getPlaceholderDimensions(aspectRatio: number): { height: number; width: number } {
	const height = Math.sqrt(lqipPixelCount / aspectRatio);
	const width = lqipPixelCount / height;

	return { height: Math.round(height), width: Math.round(width) };
}

async function loadCache(outputPath: string): Promise<LqipMap> {
	try {
		return JSON.parse(await readFile(outputPath, 'utf8')) as LqipMap;
	} catch {
		return {};
	}
}

async function main(): Promise<void> {
	const rootPath = values['root-path'];
	const mediaPath = path.resolve(rootPath, values['media-path']);
	const outputPath = path.resolve(rootPath, values['output-path']);

	console.log(chalk.magenta('=== LQIP placeholder generation ===\n'));

	const files = await glob('**/*.{jpg,jpeg,png,webp,avif}', { cwd: mediaPath });
	const cache = await loadCache(outputPath);

	const sortedFiles = files.sort((a, b) => a.localeCompare(b));
	const next: LqipMap = {};
	let generated = 0;
	let reused = 0;

	for (const relPath of sortedFiles) {
		const { mtimeMs } = await stat(path.join(mediaPath, relPath));
		const mtime = Math.round(mtimeMs);
		const cached = cache[relPath];

		if (cached?.mtime === mtime) {
			next[relPath] = cached;
			reused += 1;
			continue;
		}

		next[relPath] = { lqip: await generateLqip(path.join(mediaPath, relPath)), mtime };
		generated += 1;
		console.log(chalk.green(`✓ ${relPath}`));
	}

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(next, undefined, '\t')}\n`);

	const pruned = Object.keys(cache).filter((key) => !Object.hasOwn(next, key)).length;

	console.log(
		chalk.gray(
			`\n${String(generated)} generated, ${String(reused)} cached${pruned > 0 ? `, ${String(pruned)} pruned` : ''}`,
		),
	);
	console.log(chalk.gray(`Output: ${outputPath}`));
}

await main();
