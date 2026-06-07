// @ts-check
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { remarkAutoImport } from '@xsynaptic/remark-auto-import';
import expressiveCode from 'astro-expressive-code';
import { defineConfig, envField, fontProviders } from 'astro/config';

export default defineConfig({
	env: {
		schema: {
			UMAMI_DOMAIN: envField.string({ access: 'public', context: 'client', optional: true }),
			UMAMI_ID: envField.string({ access: 'public', context: 'client', optional: true }),
			WEBMENTION_DOMAIN: envField.string({ access: 'public', context: 'client', optional: true }),
		},
	},
	experimental: {
		contentIntellisense: true,
	},
	// Note: fallback fonts are handled in `styles/themes/fonts.css`
	fonts: [
		{
			cssVariable: '--font-aleo',
			fallbacks: [],
			name: 'Aleo',
			optimizedFallbacks: false,
			provider: fontProviders.fontsource(),
			styles: ['normal'],
			subsets: ['latin'],
			weights: ['300 700'],
		},
		{
			cssVariable: '--font-geist',
			fallbacks: [],
			name: 'Geist',
			optimizedFallbacks: false,
			provider: fontProviders.fontsource(),
			styles: ['normal'],
			subsets: ['latin'],
			weights: ['300 700'],
		},
		{
			cssVariable: '--font-geist-mono',
			fallbacks: [],
			name: 'Geist Mono',
			optimizedFallbacks: false,
			provider: fontProviders.fontsource(),
			styles: ['normal'],
			subsets: ['latin'],
			weights: ['300 700'],
		},
	],
	integrations: [expressiveCode(), mdx(), sitemap()],
	markdown: {
		processor: unified({
			remarkPlugins: [
				remarkAutoImport({
					imports: [
						{
							'./src/components/mdx/link.astro': [['default', 'Link']],
							'./src/components/mdx/more.astro': [['default', 'More']],
						},
					],
				}),
			],
			remarkRehype: { footnoteLabelTagName: 'h3' },
		}),
	},
	site: import.meta.env.PROD ? 'https://synapticism.com/' : 'http://localhost:4321/',
	vite: {
		build: {
			rollupOptions: {
				output: {
					chunkFileNames: 'js/c-[hash].js',
					entryFileNames: 'js/a-[hash].js',
				},
			},
		},
		plugins: [tailwindcss()],
	},
});
