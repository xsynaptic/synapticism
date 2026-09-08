import { openGraphBasePath, siteTagline, siteTitle } from '@synapticism/shared/constants';
import { openGraphIndexIds } from '@synapticism/shared/open-graph';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { OpenGraphContentEntry } from './types.js';

import { getOpenGraphContentEntries } from './content.js';

// astro-seo writes `property` before `content`; the closing quote keeps og:image:url|type|alt out
const openGraphMetaPattern = /<meta property="og:image" content="([^"]+)"\s*\/?>/g;

// Collection titles mirror i18n-strings.ts; no import map reaches the app's aliases from here
const indexEntries: Array<Pick<OpenGraphContentEntry, 'outputId' | 'title'>> = [
	{ outputId: openGraphIndexIds.home, title: siteTagline },
	{ outputId: openGraphIndexIds.notes, title: 'Notes' },
	{ outputId: openGraphIndexIds.posts, title: 'Posts' },
	{ outputId: openGraphIndexIds.projects, title: 'Projects' },
	{ outputId: openGraphIndexIds.tags, title: 'Tags' },
	{ outputId: openGraphIndexIds.default, title: siteTitle },
];

// Built HTML decides which cards exist, so none is drawn for a page that asks for none
export async function getBuiltEntries({
	distPath,
}: {
	distPath: string;
}): Promise<{ entries: Array<OpenGraphContentEntry>; unresolved: Array<string> }> {
	if (!existsSync(distPath)) {
		throw new Error(`No build to read at ${distPath}. Run \`pnpm build\` first.`);
	}

	const candidates = await buildCandidates();

	const entries: Array<OpenGraphContentEntry> = [];
	const unresolved: Array<string> = [];

	for (const outputId of extractBuiltOutputIds(distPath)) {
		const entry = candidates.get(outputId);

		if (entry) {
			entries.push(entry);
			continue;
		}

		unresolved.push(outputId);
	}

	return { entries, unresolved };
}

async function buildCandidates(): Promise<Map<string, OpenGraphContentEntry>> {
	// An index card has no data store entry, so its title stands in as the digest
	const candidates = new Map<string, OpenGraphContentEntry>(
		indexEntries.map((entry) => [entry.outputId, { ...entry, digest: entry.title }]),
	);

	const contentEntries = await getOpenGraphContentEntries();

	for (const entry of contentEntries) {
		candidates.set(entry.outputId, entry);
	}

	return candidates;
}

function extractBuiltOutputIds(distPath: string): Set<string> {
	const pathSegment = `/${openGraphBasePath}/`;
	const outputIds = new Set<string>();

	function collectFromHtml(filePath: string): void {
		const html = readFileSync(filePath, 'utf8');

		for (const match of html.matchAll(openGraphMetaPattern)) {
			const url = match[1] ?? '';
			const index = url.indexOf(pathSegment);

			if (index === -1) continue;

			const outputId = url.slice(index + pathSegment.length).replace(/\.[^.]+$/, '');

			if (outputId) outputIds.add(outputId);
		}
	}

	function walk(directory: string): void {
		const dirents = readdirSync(directory, { withFileTypes: true });

		for (const dirent of dirents) {
			const fullPath = path.join(directory, dirent.name);

			if (dirent.isDirectory()) {
				walk(fullPath);
				continue;
			}

			if (dirent.isFile() && dirent.name.endsWith('.html')) collectFromHtml(fullPath);
		}
	}

	walk(distPath);

	return outputIds;
}
