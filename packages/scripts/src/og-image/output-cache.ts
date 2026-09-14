import {
	openGraphImageFormat,
	openGraphImageHeight,
	openGraphImageWidth,
} from '@synapticism/shared/constants';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Manifest = Record<string, string>;

// Everything that decides a card's pixels; hashed so a template edit can never be forgotten
const templateFiles = ['constants.ts', 'element.tsx', 'fonts.ts', 'generate.ts'];

const templateVersion = hashTemplateFiles();

const manifestFile = 'manifest.json';

// Records the key a card was last written under, so freshness survives a wiped dist
export async function createOutputCache(dir: string) {
	const manifestPath = path.join(dir, manifestFile);
	const recorded = await loadManifest(manifestPath);

	function filePath(outputId: string): string {
		return path.join(dir, `${outputId}.${openGraphImageFormat}`);
	}

	async function isFresh(outputId: string, key: string): Promise<boolean> {
		if (recorded.get(outputId) !== key) return false;

		try {
			await stat(filePath(outputId));

			return true;
		} catch {
			return false;
		}
	}

	async function prune(outputIds: Set<string>): Promise<number> {
		// An empty set means a stale or missing `dist/`, never "delete everything"
		if (outputIds.size === 0) return 0;

		const suffix = `.${openGraphImageFormat}`;
		const files = await readdir(dir);
		let removed = 0;

		for (const file of files) {
			if (!file.endsWith(suffix) || outputIds.has(file.slice(0, -suffix.length))) continue;

			await rm(path.join(dir, file));
			removed++;
		}

		for (const outputId of recorded.keys()) {
			if (!outputIds.has(outputId)) recorded.delete(outputId);
		}

		return removed;
	}

	async function write(outputId: string, key: string, data: Uint8Array): Promise<void> {
		const target = filePath(outputId);

		if (await hasChanged(target, data)) await writeFile(target, data);

		recorded.set(outputId, key);
	}

	async function save(): Promise<void> {
		const sorted = [...recorded].sort(([first], [second]) => first.localeCompare(second));

		await writeFile(
			manifestPath,
			`${JSON.stringify(Object.fromEntries(sorted), undefined, '\t')}\n`,
		);
	}

	await mkdir(dir, { recursive: true });

	return { filePath, isFresh, prune, save, write };
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

// A template edit that leaves the pixels alone should not move the cached card's mtime
async function hasChanged(target: string, data: Uint8Array): Promise<boolean> {
	try {
		const existing = await readFile(target);

		return !existing.equals(data);
	} catch {
		return true;
	}
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

async function loadManifest(manifestPath: string): Promise<Map<string, string>> {
	try {
		return new Map(Object.entries(JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest));
	} catch {
		return new Map();
	}
}
