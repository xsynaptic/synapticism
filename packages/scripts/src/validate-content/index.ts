#!/usr/bin/env node
import type { CollectionKey } from 'astro:content';

import {
	checkComponentProps,
	checkComponentTargets,
	checkEntryIds,
	checkReferences,
	getCollectionEntries,
	runValidations,
	withAstroContent,
	withSpinner,
} from '@xsynaptic/astro-scripts';

import { runCommand } from '#shared/command.ts';
import { validateImages } from '#validate-content/images.ts';

const collections = ['pages', 'posts', 'projects', 'tags'] satisfies Array<CollectionKey>;

const checkNames = ['entry-ids', 'images', 'link-ids', 'mdx', 'references'] as const;

await runCommand({
	name: 'validate-content',
	positional: {
		choices: checkNames,
		description: 'Run one check',
		name: 'check',
	},
	run: async ({ paths, positionals, rootPath }) => {
		const entries = await withSpinner('Loading content', () =>
			withAstroContent((content) => getCollectionEntries(content, collections)),
		);

		await runValidations(
			checkNames,
			{
				'entry-ids': () => checkEntryIds(entries),
				images: () => validateImages(entries, paths.mediaPath),
				'link-ids': () =>
					checkComponentTargets(entries, {
						component: 'Link',
						label: 'Link ID',
						prop: 'id',
						rootPath,
						targets: entries.map((entry) => entry.id),
					}),
				mdx: () =>
					checkComponentProps(entries, {
						required: { Img: 'src', Link: 'id', Quotation: 'author' },
						rootPath,
					}),
				references: () => checkReferences(entries),
			},
			{ only: positionals[0] },
		);
	},
	summary: 'Check content entries for broken IDs, images, links, components and references',
	title: 'Validate content',
});
