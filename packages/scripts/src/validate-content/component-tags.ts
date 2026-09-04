import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { ContentEntry } from '../shared/astro-content.js';

export interface ComponentTag {
	lineNumber: number;
	name: string;
	props: string;
}

const componentTagRegex = /<([A-Z]\w*)((?:\s[^>]*?)?)\/?>/g;

export function findComponentTags(
	entry: ContentEntry,
	names: ReadonlyArray<string>,
	rootPath: string,
): Array<ComponentTag> {
	const body = entry.body;

	if (!body) return [];

	const lineOffset = getBodyLineOffset(entry, rootPath);
	const tags: Array<ComponentTag> = [];

	for (const match of body.matchAll(componentTagRegex)) {
		const name = match[1];

		if (!name || !names.includes(name)) continue;

		tags.push({
			lineNumber: lineOffset + body.slice(0, match.index).split('\n').length,
			name,
			props: match[2] ?? '',
		});
	}

	return tags;
}

export function getTagProp({ props }: ComponentTag, name: string): string | undefined {
	return new RegExp(`${name}=["']([^"']+)["']`).exec(props)?.[1];
}

// `entry.body` drops the frontmatter, so line numbers need its offset to point at the real file
function getBodyLineOffset(entry: ContentEntry, rootPath: string) {
	if (!entry.filePath || !entry.body) return 0;

	const source = readFileSync(path.join(rootPath, entry.filePath), 'utf8');
	const bodyIndex = source.indexOf(entry.body);

	if (bodyIndex === -1) return 0;

	return source.slice(0, bodyIndex).split('\n').length - 1;
}
