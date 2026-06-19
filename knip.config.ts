// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- the @ts-nocheck below is intentional
// @ts-nocheck -- KnipConfig is very expensive and we only need this when modifying the config
import type { KnipConfig } from 'knip';

export default {
	workspaces: {
		'.': {
			// MDX components are provided to <Content> at render time via renderContent (src/lib/utils/astro.ts)
			entry: ['src/components/mdx/*.astro'],
			ignoreDependencies: [
				'eslint-plugin-jsx-a11y', // transitive dep required by eslint-plugin-astro jsx-a11y-strict
				// Planned integrations; not yet wired up
				'@unpic/astro',
				'@unpic/core',
				'astro-pagefind',
				'eslint-plugin-react-hooks',
			],
		},
		'packages/content': {
			// Config and ambient-type files consumed by tooling, not imported
			entry: ['.remarkrc.mjs', 'global.d.ts'],
			// Content is loaded by Astro's glob loader via a path string, which knip can't trace
			ignore: ['collections/**'],
			ignoreDependencies: [
				'react', // type-only: jsxImportSource + React.JSX in global.d.ts for the MDX language server
				'remark', // used via unified pipeline
			],
		},
		'packages/scripts': {
			ignoreBinaries: ['ssh-add'], // system binary used in deploy scripts
		},
	},
} satisfies KnipConfig;
