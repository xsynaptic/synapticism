import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';

import { createCardRenderer, decodeImage, resolveMediaPath } from '@synapticism/scripts/og-image';

import { getSampleOpenGraphCards } from '#dev/inventory/inventory-fixtures.ts';

let renderCard: ReturnType<typeof createCardRenderer> | undefined;

function getRenderCard() {
	if (!renderCard) {
		renderCard = createCardRenderer();
	}

	return renderCard;
}

async function readImage(imageId: string | undefined) {
	if (imageId === undefined) return;

	return decodeImage(resolveMediaPath(imageId));
}

export const getStaticPaths = (async () => {
	const cards = await getSampleOpenGraphCards();

	return cards.map((card) => ({ params: { key: card.key }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET = (async ({ props: { card } }) => {
	const render = await getRenderCard();
	const image = await readImage(card.imageId);

	// Takumi can hand back a view on a SharedArrayBuffer, which Response rejects
	return new Response(
		new Uint8Array(await render({ description: card.description, title: card.title }, image)),
		{
			headers: { 'cache-control': 'no-store', 'content-type': 'image/jpeg' },
		},
	);
}) satisfies APIRoute<InferGetStaticPropsType<typeof getStaticPaths>>;
