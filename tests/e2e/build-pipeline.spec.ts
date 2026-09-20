import { getBaseUrl } from '#e2e/constants.ts';
import { expect, test } from '#e2e/test.ts';

// A `dist/` made by bare `astro build` has no cards, so this catches a build that skipped the pipeline
test('an Entry names an OG card that resolves', async ({ request, site }) => {
	const entry = await request.get(site.postDetail);
	const cardUrl = /<meta property="og:image" content="([^"]+)"/.exec(await entry.text())?.[1];

	if (!cardUrl) throw new Error(`No og:image on ${site.postDetail}`);

	const card = await request.get(new URL(cardUrl, getBaseUrl()).pathname);

	expect(card.status()).toBe(200);
	expect(card.headers()['content-type']).toMatch(/image\/jpeg/);
});
