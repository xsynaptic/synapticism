import * as R from 'remeda';

import { getProjectsCollection } from '#lib/collections/projects/projects-data.ts';
import {
	createContentMetadataItems,
	sortContentMetadataByDate,
} from '#lib/metadata/metadata-utils.ts';

export async function queryProjectsIndex() {
	const { entries } = await getProjectsCollection();

	return R.pipe(entries, createContentMetadataItems, R.sort(sortContentMetadataByDate));
}
