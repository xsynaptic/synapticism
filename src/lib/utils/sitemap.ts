import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';

// Written by the sitemap-lastmod script, read back when the Astro config loads
const sitemapLastmodPath = '.cache/sitemap-lastmod.json';

const sitemapExcludePrefixes = ['/about/cv'];

const SitemapLastmodSchema = z.object({
	generatedAt: z.string(),
	urls: z.record(z.string(), z.string()),
});

type SitemapLastmod = z.infer<typeof SitemapLastmodSchema>;

export function isIndexableUrlPath(pathname: string): boolean {
	const normalized = pathname.replace(/\/$/, '');

	// Paginated routes repeat content already indexed at page one
	if (/\/\d+$/.test(normalized)) return false;

	return sitemapExcludePrefixes.every(
		(prefix) => !(normalized === prefix || normalized.startsWith(prefix + '/')),
	);
}

export function readSitemapLastmod(): SitemapLastmod {
	if (existsSync(sitemapLastmodPath)) {
		try {
			return SitemapLastmodSchema.parse(JSON.parse(readFileSync(sitemapLastmodPath, 'utf8')));
		} catch (error) {
			console.warn(
				`[sitemap] Failed to read ${sitemapLastmodPath}; falling back to the build timestamp. ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return { generatedAt: new Date().toISOString(), urls: {} };
}
