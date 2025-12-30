// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';

const DEV_SERVER_URL = 'http://localhost:4321/';
const PROD_SERVER_URL = 'https://synapticism.com/';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
	site: isProduction ? PROD_SERVER_URL : DEV_SERVER_URL,
	integrations: [mdx(), sitemap()],
	env: {
		schema: {
			UMAMI_DOMAIN: envField.string({ context: 'client', access: 'public', optional: true }),
			UMAMI_ID: envField.string({ context: 'client', access: 'public', optional: true }),
		},
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			rollupOptions: {
				output: {
					entryFileNames: 'js/a-[hash].js',
					chunkFileNames: 'js/c-[hash].js',
				},
			},
		},
	},
	experimental: {
		// Note: fallback fonts are handled in `styles/themes/fonts.css`
		fonts: [
			{
				provider: fontProviders.fontsource(),
				name: 'IBM Plex Sans',
				cssVariable: '--font-ibm-plex-sans',
				weights: ['300 700'],
				styles: ['normal'],
				subsets: ['latin'],
				fallbacks: [],
				optimizedFallbacks: false,
			},
			{
				provider: fontProviders.fontsource(),
				name: 'Aleo',
				cssVariable: '--font-aleo',
				weights: ['300 700'],
				styles: ['normal'],
				subsets: ['latin'],
				fallbacks: [],
				optimizedFallbacks: false,
			},
			{
				provider: fontProviders.fontsource(),
				name: 'Geist',
				cssVariable: '--font-geist',
				weights: ['300 700'],
				styles: ['normal'],
				subsets: ['latin'],
				fallbacks: [],
				optimizedFallbacks: false,
			},
			{
				provider: fontProviders.fontsource(),
				name: 'Geist Mono',
				cssVariable: '--font-geist-mono',
				weights: ['300 700'],
				styles: ['normal'],
				subsets: ['latin'],
				fallbacks: [],
				optimizedFallbacks: false,
			},
		],
		contentIntellisense: true,
	},
});
