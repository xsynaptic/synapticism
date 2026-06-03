// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- KnipConfig is very expensive and we only need this when modifying the config
import type { KnipConfig } from 'knip';

export default {
	workspaces: {
		'.': {
			// MDX auto-import components; referenced via remark-auto-import, not static imports
			entry: ['src/components/mdx/*.astro'],
			ignoreDependencies: [
				'eslint-plugin-jsx-a11y', // transitive dep required by eslint-plugin-astro jsx-a11y-strict
				// Planned integrations; not yet wired up
				'@astrojs/node',
				'@astrojs/rss',
				'@unpic/astro',
				'@unpic/core',
				'astro-pagefind',
				'astro-seo',
				'eslint-plugin-react-hooks',
				'remeda',
			],
		},
		'packages/content': {
			ignoreDependencies: [
				'eslint-mdx', // referenced in eslint config
				'eslint-plugin-mdx', // referenced in eslint config
				'remark', // used via unified pipeline
				'remark-lint-list-item-indent', // remark preset plugin
				'remark-mdx', // remark preset plugin
				'remark-preset-lint-consistent', // remark preset
				'remark-preset-lint-recommended', // remark preset
				'unified', // used via remark pipeline
			],
		},
		'packages/scripts': {
			ignoreBinaries: ['ssh-add'], // system binary used in deploy scripts
		},
	},
} satisfies KnipConfig;
