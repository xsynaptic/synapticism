import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';

import { createCardRenderer } from '@synapticism/scripts/og-image';

import { getSampleOpenGraphCards } from '#dev/inventory/inventory-fixtures.ts';

let renderCard: ReturnType<typeof createCardRenderer> | undefined;

function getRenderCard() {
	if (!renderCard) {
		renderCard = createCardRenderer();
	}

	return renderCard;
}

export const getStaticPaths = (async () => {
	const cards = await getSampleOpenGraphCards();

	return cards.map((card) => ({ params: { key: card.key }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET = (async ({ props: { card } }) => {
	const render = await getRenderCard();

	// Takumi can hand back a view on a SharedArrayBuffer, which Response rejects
	return new Response(new Uint8Array(await render(card)), {
		headers: { 'cache-control': 'no-store', 'content-type': 'image/jpeg' },
	});
}) satisfies APIRoute<InferGetStaticPropsType<typeof getStaticPaths>>;
