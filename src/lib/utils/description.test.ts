import { createSqliteCache } from '@synapticism/shared/cache';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';

import type { DescriptionRendered } from '#lib/utils/description.ts';

import { createDescriptionRenderers } from '#lib/utils/description.ts';

function setup() {
	const cache = createSqliteCache<DescriptionRendered>(
		mkdtempSync(path.join(tmpdir(), 'description-cache-')),
		'description-rendered',
	);
	const setSpy = vi.spyOn(cache, 'set');

	return { setSpy, ...createDescriptionRenderers({ cache }) };
}

describe('createDescriptionRenderers', () => {
	test('keeps inline emphasis in html and strips it from text', () => {
		const { getDescriptionRendered } = setup();

		const rendered = getDescriptionRendered({
			data: { description: 'A *thoroughly* ordinary place.' },
			id: 'alpha',
		});

		expect(rendered?.html).toBe('A <em>thoroughly</em> ordinary place.');
		expect(rendered?.text).toBe('A thoroughly ordinary place.');
	});

	test('serves a repeat call from the cache', () => {
		const { getDescriptionRendered, setSpy } = setup();
		const entry = { data: { description: 'A place.' }, id: 'alpha' };

		const first = getDescriptionRendered(entry);
		const second = getDescriptionRendered(entry);

		expect(second).toEqual(first);
		expect(setSpy).toHaveBeenCalledTimes(1);
	});

	test('changed source invalidates the cached entry', () => {
		const { getDescriptionRendered, setSpy } = setup();

		getDescriptionRendered({ data: { description: 'A place.' }, id: 'alpha' });

		const second = getDescriptionRendered({
			data: { description: 'Another place.' },
			id: 'alpha',
		});

		expect(second?.text).toBe('Another place.');
		expect(setSpy).toHaveBeenCalledTimes(2);
	});
});
