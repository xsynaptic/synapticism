import {
	openGraphImageFormat,
	openGraphImageHeight,
	openGraphImageWidth,
} from '@synapticism/shared/constants';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Manifest = Record<string, string>;

// Everything that decides a card's pixels; hashed so a template edit can never be forgotten
const templateFiles = ['constants.ts', 'element.tsx', 'fonts.ts', 'generate.ts'];

const templateVersion = hashTemplateFiles();

const manifestFile = 'manifest.json';

// Records the key a card was last written under, so freshness survives a wiped dist
// Orphan keys stay: no card file is ever deleted, so dropping one re-renders bytes already on disk
export async function createOutputCache(dir: string) {
	const manifestPath = path.join(dir, manifestFile);
	const recorded = await loadManifest(manifestPath);

	function filePath(outputId: string): string {
		return path.join(dir, `${outputId}.${openGraphImageFormat}`);
	}

	async function isFresh(outputId: string, key: string): Promise<boolean> {
		if (recorded[outputId] !== key) return false;

		try {
			await stat(filePath(outputId));

			return true;
		} catch {
			return false;
		}
	}

	async function write(outputId: string, key: string, data: Uint8Array): Promise<void> {
		await writeFile(filePath(outputId), data);

		recorded[outputId] = key;
	}

	async function save(): Promise<void> {
		const sorted = Object.entries(recorded).sort(([first], [second]) =>
			first.localeCompare(second),
		);

		await writeFile(
			manifestPath,
			`${JSON.stringify(Object.fromEntries(sorted), undefined, '\t')}\n`,
		);
	}

	await mkdir(dir, { recursive: true });

	return { filePath, isFresh, save, write };
}

export function getOutputCacheKey({
	digest,
	imageId,
	imageModifiedTime,
}: {
	digest: string;
	imageId: string | undefined;
	imageModifiedTime: number | undefined;
}): string {
	return [templateVersion, digest, imageId ?? '', imageModifiedTime ?? ''].join(':');
}

function hashTemplateFiles(): string {
	const hash = createHash('sha256').update(
		`${String(openGraphImageWidth)}x${String(openGraphImageHeight)}`,
	);

	for (const file of templateFiles) {
		hash.update(readFileSync(new URL(file, import.meta.url), 'utf8'));
	}

	return hash.digest('hex').slice(0, 8);
}

async function loadManifest(manifestPath: string): Promise<Manifest> {
	try {
		return JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
	} catch {
		return {};
	}
}
