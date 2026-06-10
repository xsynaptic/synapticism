import * as R from 'remeda';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';

// The interleaved homepage stream: posts and notes merged, reverse-chronological
export async function queryRecentStream() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('posts', 'notes'), R.sort(sortCatalogByDate));
}
