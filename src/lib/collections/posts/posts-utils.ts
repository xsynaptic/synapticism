import * as R from 'remeda';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';
import { getPostsCollection } from '#lib/collections/posts/posts-data.ts';
import { createCollectionLookupByIds } from '#lib/utils/collections.ts';

/**
 * @expected-unused
 * @knipignore staged for the launch design; mirrors the lookup other collections already use
 */
export const createPostsByIdsFunction = createCollectionLookupByIds('Posts', getPostsCollection);

export async function queryPostsIndex() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('posts'), R.sort(sortCatalogByDate));
}
