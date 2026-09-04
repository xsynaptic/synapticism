import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { loadOpenGraphFonts } from './fonts.js';
import { createRenderer, processImage } from './generate.js';

const outDir = process.argv[2] ?? '.';
const imagePath = process.argv[3];

const render = createRenderer(await loadOpenGraphFonts());
const image = imagePath ? await processImage(imagePath) : undefined;

const cards = [
	{
		key: 'title-clamped',
		title:
			'A title long enough to run past the four lines the card allows, which is what the clamp is for: the words keep coming, the size has already bottomed out on the ramp, and the last of it is dropped rather than allowed to push the wordmark off the foot of the frame',
		withImage: false,
	},
	{
		key: 'image-long',
		title: 'Drawing a social preview card without a browser anywhere in the loop',
		withImage: true,
	},
];

for (const card of cards) {
	const buffer = await render(
		{ collection: 'inventory', id: card.key, label: 'inventory', title: card.title },
		card.withImage ? image : undefined,
	);

	await writeFile(path.join(outDir, `${card.key}.jpg`), buffer);
	console.log(card.key, buffer.length);
}
