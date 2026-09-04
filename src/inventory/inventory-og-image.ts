import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';

import { createRenderer, loadOpenGraphFonts, processImage } from '@synapticism/scripts/og-image';

import { getSampleOpenGraphCards } from '#inventory/inventory-fixtures.ts';

// Fonts and glyph outlines live on the renderer, so build one and hold it for the dev server
let renderCard: Promise<ReturnType<typeof createRenderer>> | undefined;

async function createRenderCard() {
	return createRenderer(await loadOpenGraphFonts());
}

function getRenderCard() {
	if (!renderCard) {
		renderCard = createRenderCard();
	}

	return renderCard;
}

export const getStaticPaths = (async () => {
	const cards = await getSampleOpenGraphCards();

	return cards.map((card) => ({ params: { key: card.key }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET = (async ({ props: { card } }) => {
	const image = card.imagePath ? await processImage(card.imagePath) : undefined;

	const render = await getRenderCard();

	return new Response(await render(card.entry, image), {
		headers: { 'content-type': 'image/jpeg' },
	});
}) satisfies APIRoute<InferGetStaticPropsType<typeof getStaticPaths>>;
