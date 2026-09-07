import type { CollectionKey } from 'astro:content';

const { BASE_URL, SITE } = import.meta.env;

// Join URL path segments, collapsing the double slashes the join introduces; the scheme's `//` is spared
export function joinUrl(...parts: Array<string>): string {
	return parts.join('/').replaceAll(/(?<!:)\/\/+/g, '/');
}

export const getBasePath = (...routeParts: Array<string>): string =>
	joinUrl(BASE_URL, ...routeParts);

// Example: /base/{routeParts}
export const getSitePath = (...routeParts: Array<string>): string =>
	joinUrl(BASE_URL, ...routeParts, '/');

export const getAbsoluteUrl = (path: string): string => new URL(path, SITE).href;

// Pages are flat (URL mirrors the file system); every other collection is sectioned under /{collection}/
export const getContentPath = (collection: CollectionKey, ...routeParts: Array<string>): string =>
	getSitePath(collection === 'pages' ? '' : collection, ...routeParts);
