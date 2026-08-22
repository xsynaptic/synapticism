import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Ledger = Record<string, string>;

// Records the key a card was last written under, so freshness survives a wiped dist
export async function createOutputCache({
	dir,
	ledgerPath,
	version,
}: {
	dir: string;
	ledgerPath: string;
	version: string;
}) {
	const recorded = await loadLedger(ledgerPath);
	const next: Ledger = {};

	function filePath(id: string): string {
		return path.join(dir, `${id}.jpg`);
	}

	// Recording here is what keeps the saved ledger down to the ids this run asked about
	async function isFresh(id: string, key: string): Promise<boolean> {
		const effectiveKey = `${version}:${key}`;

		next[id] = effectiveKey;

		if (recorded[id] !== effectiveKey) return false;

		try {
			await stat(filePath(id));

			return true;
		} catch {
			return false;
		}
	}

	async function write(id: string, data: Uint8Array): Promise<void> {
		const file = filePath(id);

		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, data);
	}

	// A published OG path is permanent, so cards are never pruned; only the ledger is
	async function save(): Promise<void> {
		await mkdir(path.dirname(ledgerPath), { recursive: true });
		await writeFile(ledgerPath, `${JSON.stringify(next, undefined, '\t')}\n`);
	}

	return { isFresh, save, write };
}

// A card goes stale when its content, its source image, or the template changes
export function getOutputCacheKey({
	digest,
	imageId,
	imageModifiedTime,
}: {
	digest: string;
	imageId: string | undefined;
	imageModifiedTime: number | undefined;
}): string {
	return `${digest}:${imageId ?? ''}:${String(imageModifiedTime ?? '')}`;
}

async function loadLedger(ledgerPath: string): Promise<Ledger> {
	try {
		return JSON.parse(await readFile(ledgerPath, 'utf8')) as Ledger;
	} catch {
		return {};
	}
}
