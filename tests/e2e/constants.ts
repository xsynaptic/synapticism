import { readFileSync } from 'node:fs';

// resonance holds 47_322, so both suites can run at once
export const localPort = 47_323;
export const localUrl = `http://localhost:${String(localPort)}`;

export const isDev = process.env.TEST_ENV === 'dev';
export const isProd = process.env.TEST_ENV === 'prod';

// Must match `siteUrl` in packages/scripts/src/deploy/deploy-config.ts
export const prodUrl = 'https://synapticism.com/';

export const contentManifestPath = '/content-manifest.json';
export const feedPath = '/rss.xml';

export const routes = {
	postsIndex: '/posts/',
	projectsIndex: '/projects/',
} as const;

function readDevServerUrl(): string {
	const { url } = JSON.parse(readFileSync('.astro/dev.json', 'utf8')) as { url: string };

	return url;
}

export function getBaseUrl(): string {
	if (isProd) return process.env.PROD_SERVER_URL ?? prodUrl;
	if (isDev) return readDevServerUrl();

	return localUrl;
}
