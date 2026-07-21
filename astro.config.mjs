// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { autoImport } from '@xsynaptic/satteri-auto-import';
import { readingTime } from '@xsynaptic/satteri-reading-time';
import pagefind from 'astro-pagefind';
import { defineConfig, envField, fontProviders } from 'astro/config';
import expressiveCode from 'satteri-expressive-code';

import { expressiveCodeOptions } from './expressive-code.config.mjs';

export default defineConfig({
	env: {
		schema: {
			CUSTOM_CACHE_PATH: envField.string({
				access: 'public',
				context: 'server',
				default: './.cache',
			}),
			UMAMI_DOMAIN: envField.string({ access: 'public', context: 'client', optional: true }),
			UMAMI_ID: envField.string({ access: 'public', context: 'client', optional: true }),
			WEBMENTION_DOMAIN: envField.string({ access: 'public', context: 'client', optional: true }),
		},
	},
	experimental: {
		contentIntellisense: true,
	},
	fonts: [
		{
			cssVariable: '--font-aleo',
			name: 'Aleo',
			provider: fontProviders.fontsource(),
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			weights: ['300 700'],
		},
		{
			cssVariable: '--font-geist-mono',
			fallbacks: ['monospace'],
			name: 'Geist Mono',
			provider: fontProviders.fontsource(),
			styles: ['normal'],
			subsets: ['latin'],
			weights: ['300 700'],
		},
	],
	image: {
		layout: 'constrained',
		responsiveStyles: true,
	},
	integrations: [
		mdx(),
		sitemap(),
		pagefind({
			indexConfig: {
				excludeSelectors: [
					"[id='footnote-label']",
					"[id^='user-content-fnref']",
					'[data-footnote-backref]',
				],
			},
		}),
	],
	markdown: {
		processor: satteri({
			hastPlugins: [expressiveCode(expressiveCodeOptions)],
			mdastPlugins: [
				autoImport({
					imports: [
						{
							'./src/components/mdx/img.astro': [['default', 'Img']],
							'./src/components/mdx/link.astro': [['default', 'Link']],
							'./src/components/mdx/more.astro': [['default', 'More']],
							'./src/components/mdx/quotation.astro': [['default', 'Quotation']],
						},
					],
				}),
				readingTime(),
			],
		}),
		// EC (the satteri-expressive-code hast plugin) owns highlighting
		syntaxHighlight: false,
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
		// The prerender chunks runtime-import @keyv/sqlite (build-time word-count cache)
		ssr: {
			external: ['@keyv/sqlite', 'sqlite3', 'bindings'],
		},
	},
});
