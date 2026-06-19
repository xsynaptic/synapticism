import type { CollectionKey } from 'astro:content';

import urlJoin from 'url-join';

const { BASE_URL, PROD, SITE } = import.meta.env;

// Example: /base/{routeParts}
export const getSiteUrl = (...routeParts: Array<string>): string =>
	urlJoin(PROD ? SITE : BASE_URL, ...routeParts, '/');

// Pages are flat (URL mirrors the file system); every other collection is sectioned under /{collection}/
export const getContentUrl = (collection: CollectionKey, ...routeParts: Array<string>): string =>
	getSiteUrl(collection === 'pages' ? '' : collection, ...routeParts);
