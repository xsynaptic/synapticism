import type { APIRequestContext } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { routes } from '#e2e/constants.ts';

async function readMain(request: APIRequestContext, path: string): Promise<string> {
	const response = await request.get(path);

	expect(response.status(), `${path} status`).toBe(200);

	return /<main[\s\S]*?<\/main>/.exec(await response.text())?.[0] ?? '';
}

function readFirstText(html: string, tag: string): string {
	const inner = new RegExp(String.raw`<${tag}[^>]*>([\s\S]*?)</${tag}>`).exec(html)?.[1] ?? '';

	return inner.replaceAll(/<[^>]+>/g, '').trim();
}

test('every List Page reaches an Entry that renders', { tag: '@smoke' }, async ({ request }) => {
	for (const indexPath of Object.values(routes)) {
		const detailPattern = new RegExp(`^${indexPath}[^/]+/$`);
		const index = await readMain(request, indexPath);
		const detailPath = [...index.matchAll(/href="([^"]+)"/g)]
			.map(([, href = '']) => href)
			.find((href) => detailPattern.test(href));

		if (!detailPath) throw new Error(`No Entry listed on ${indexPath}`);

		const main = await readMain(request, detailPath);

		expect(readFirstText(main, 'h1'), `${detailPath} heading`).not.toBe('');
		expect(readFirstText(main, 'p'), `${detailPath} body`).not.toBe('');
	}
});
