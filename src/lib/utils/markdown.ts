import { markdownToHtml } from 'satteri';

// Render a short markdown string (descriptions, notices, teasers) to inline HTML
// Stripping or sanitizing is left to callers that need it
const cache = new Map<string, string>();

export function renderMarkdownInline(input: string): string {
	const cached = cache.get(input);
	if (cached !== undefined) return cached;

	const { html } = markdownToHtml(input, {
		features: { smartPunctuation: true },
	});
	const result = html.trim();

	cache.set(input, result);
	return result;
}
