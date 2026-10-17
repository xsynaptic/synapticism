import type { KnipConfig } from 'knip';

export default {
	// Exports kept deliberately carry `@knipignore` with the reason at the declaration
	tags: ['-knipignore'],
	workspaces: {
		'.': {
			// MDX components are provided to <Content> at render time via renderContent (src/lib/utils/astro.ts)
			entry: [
				'src/components/mdx/*.astro',
				'src/dev/inventory/inventory.astro',
				'src/dev/inventory/inventory-og-image.ts',
			],
			ignoreDependencies: [
				'@synapticism/lab', // imported only from MDX in packages/content, which this workspace does not scan
				'eslint-plugin-jsx-a11y', // peer of eslint-plugin-astro's a11y-strict config; referenced by string, not import
				'wrangler', // used via wrangler.jsonc + the deploy script ($`wrangler deploy`), neither traceable
			],
		},
		'packages/content': {
			// The content scripts delegate to root via `pnpm -w run`, which knip reads as a binary
			ignoreBinaries: ['check-content', 'fix-content', 'validate-content'],
			ignoreDependencies: [
				'mdxlint', // enables knip's MDX plugin here; there is no `astro` devDep to do it
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
			],
		},
		// An `exports` map makes every file an entry, and entry exports go unchecked by default
		'packages/shared': {
			includeEntryExports: true,
		},
	},
} satisfies KnipConfig;
