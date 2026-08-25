import type { CollectionKey } from 'astro:content';

const { BASE_URL, PROD, SITE } = import.meta.env;

// Join URL path segments, collapsing the double slashes the join introduces; the scheme's `//` is spared
export function joinUrl(...parts: Array<string>): string {
	return parts.join('/').replaceAll(/(?<!:)\/\/+/g, '/');
}

// Example: /base/{routeParts}
export const getSiteUrl = (...routeParts: Array<string>): string =>
	joinUrl(PROD ? SITE : BASE_URL, ...routeParts, '/');

// Pages are flat (URL mirrors the file system); every other collection is sectioned under /{collection}/
export const getContentUrl = (collection: CollectionKey, ...routeParts: Array<string>): string =>
	getSiteUrl(collection === 'pages' ? '' : collection, ...routeParts);
