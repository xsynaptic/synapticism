// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- the @ts-nocheck below is intentional
// @ts-nocheck -- KnipConfig is very expensive and we only need this when modifying the config
import type { KnipConfig } from 'knip';

export default {
	workspaces: {
		'.': {
			// MDX components are provided to <Content> at render time via renderContent (src/lib/utils/astro.ts)
			entry: ['src/components/mdx/*.astro'],
			ignoreDependencies: [
				'@synapticism/lab', // imported only from posts in packages/content/collections, which knip ignores
				'astro-pagefind',
				'eslint-plugin-jsx-a11y', // peer of eslint-plugin-astro's a11y-strict config; referenced by string, not import
				'eslint-plugin-react-hooks',
				'wrangler', // used via wrangler.jsonc + the deploy script ($`wrangler deploy`), neither traceable
			],
		},
		'packages/content': {
			// Config and ambient-type files consumed by tooling, not imported
			entry: ['.mdxlintrc.mjs', 'global.d.ts'],
			// Content is loaded by Astro's glob loader via a path string, which knip can't trace
			ignore: ['collections/**'],
			// The content scripts delegate to root via `pnpm -w run`, which knip reads as a binary
			ignoreBinaries: ['check-content', 'fix-content'],
			ignoreDependencies: [
				'react', // type-only: jsxImportSource + React.JSX in global.d.ts for the MDX language server
				'@textlint-rule/textlint-rule-pattern', // referenced by name in .textlintrc.json
				'textlint-plugin-mdx',
				'textlint-rule-diacritics',
			],
		},
		'packages/lab': {
			// Experiments are imported ad hoc
			entry: ['*/*.astro', '*/*.ts'],
		},
		'packages/scripts': {
			ignoreDependencies: [
				'@fontsource/geist', // OG fonts resolved at build via a fontsource path string knip can't trace
			],
		},
	},
} satisfies KnipConfig;
