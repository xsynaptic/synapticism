import { writeFileSync } from 'node:fs';

import { buildCatalog } from '#emoji-picker/core/catalog-build.ts';
import { catalogPath, loadCatalogSources } from '#emoji-picker/scripts/catalog-sources.ts';

const catalog = buildCatalog(loadCatalogSources());

for (const name of ['grid', 'search'] as const) {
	writeFileSync(catalogPath(name), JSON.stringify(catalog[name]));
}
