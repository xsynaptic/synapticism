import * as R from 'remeda';

import { getCatalog } from '#lib/catalog/catalog-data.ts';
import { sortCatalogByDate } from '#lib/catalog/catalog-utils.ts';

export async function queryProjectsIndex() {
	const catalog = await getCatalog();

	return R.pipe(catalog.byCollection('projects'), R.sort(sortCatalogByDate));
}
