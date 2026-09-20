// resonance holds 47_322, so both suites can run at once
export const localPort = 47_323;
export const localUrl = `http://localhost:${String(localPort)}`;

export const isProd = process.env.TEST_ENV === 'prod';

// Must match `siteUrl` in packages/scripts/src/deploy/deploy-config.ts
const prodUrl = 'https://synapticism.com/';

export const contentManifestPath = '/content-manifest.json';
export const feedPath = '/rss.xml';

export const routes = {
	notesIndex: '/notes/',
	postsIndex: '/posts/',
	projectsIndex: '/projects/',
} as const;

export function getBaseUrl(): string {
	return isProd ? (process.env.PROD_SERVER_URL ?? prodUrl) : localUrl;
}
