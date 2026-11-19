import type { CollectionEntry } from 'astro:content';

import type { ArchiveYear } from '#lib/archives/archives-utils.ts';

import { groupEntriesByArchive } from '#lib/archives/archives-utils.ts';
import { queryPostAndProjectEntries } from '#lib/collections/collections-utils.ts';
import { getPagesCollection } from '#lib/collections/pages/pages-data.ts';

type ArchiveEntry = CollectionEntry<'posts' | 'projects'>;

async function assertNoYearShapedPages() {
	const { entries } = await getPagesCollection();

	const collision = entries.find((entry) => /^\d{4}$/.test(entry.id));

	if (collision) {
		throw new Error(`[Archives] Page "${collision.id}" collides with a Year Archive path`);
	}
}

async function loadArchive(): Promise<Array<ArchiveYear<ArchiveEntry>>> {
	await assertNoYearShapedPages();

	return groupEntriesByArchive(await queryPostAndProjectEntries());
}

let archiveInstance: Promise<Array<ArchiveYear<ArchiveEntry>>> | undefined;

export async function getArchive(): Promise<Array<ArchiveYear<ArchiveEntry>>> {
	if (!archiveInstance) {
		archiveInstance = loadArchive();
	}
	return archiveInstance;
}
