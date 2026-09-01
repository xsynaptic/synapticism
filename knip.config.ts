// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- the @ts-nocheck below is intentional
// @ts-nocheck -- KnipConfig is very expensive and we only need this when modifying the config
import type { KnipConfig } from 'knip';

export default {
	// Exports kept deliberately carry `@knipignore` with the reason at the declaration
	tags: ['-knipignore'],
	workspaces: {
		'.': {
			// MDX components are provided to <Content> at render time via renderContent (src/lib/utils/astro.ts)
			entry: ['src/components/mdx/*.astro', 'src/design-system/design-system.astro'],
			ignoreDependencies: [
				'@synapticism/lab', // imported only from posts in packages/content/collections, which knip ignores
				'eslint-plugin-jsx-a11y', // peer of eslint-plugin-astro's a11y-strict config; referenced by string, not import
				'eslint-plugin-react-hooks',
				'wrangler', // used via wrangler.jsonc + the deploy script ($`wrangler deploy`), neither traceable
			],
		},
		'packages/content': {
			// The content scripts delegate to root via `pnpm -w run`, which knip reads as a binary
			ignoreBinaries: ['check-content', 'fix-content'],
			ignoreDependencies: [
				'mdxlint', // enables knip's MDX plugin here; there is no `astro` devDep to do it
				'react', // type-only: jsxImportSource + React.JSX in the ambient types for the MDX language server
			],
		},
		'packages/lab': {
			// Experiments are imported ad hoc
			entry: ['*/*.astro'],
		},
		'packages/scripts': {
			ignoreDependencies: [
				// OG fonts resolved at build via a fontsource path string knip can't trace
				'@fontsource/aleo',
				'@fontsource/geist-mono',
				// The OG card template reaches React only through the automatic JSX runtime
				'@types/react',
				'react',
			],
		},
	},
} satisfies KnipConfig;
