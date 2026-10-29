#!/usr/bin/env -S node --import tsx
import type { CardInput as RecordedCardInput } from '@xsynaptic/astro-image-pipeline/names';
import type {
	PreparedCardRender,
	RenderCounts,
	RenderFailure,
} from '@xsynaptic/astro-image-pipeline/node';
import type { Progress } from '@xsynaptic/astro-scripts';

import {
	openGraphBasePath,
	openGraphImageHeight,
	openGraphImageWidth,
} from '@synapticism/shared/constants';
import { hashTemplateVersion, prepareCardRender } from '@xsynaptic/astro-image-pipeline/node';
import { createProgress, formatCount, log, UserError } from '@xsynaptic/astro-scripts';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { createCardRenderer, decodeImage } from '#og-image/generate.ts';
import { runCommand } from '#shared/command.ts';

const templateVersion = hashTemplateVersion({
	files: ['constants.ts', 'element.tsx', 'fonts.ts', 'generate.ts'].map(
		(file) => new URL(file, import.meta.url),
	),
	from: import.meta.url,
	packages: ['takumi-js'],
	parts: [openGraphImageWidth, openGraphImageHeight],
});

function toCardInput({ label, title }: RecordedCardInput) {
	if (typeof title !== 'string') throw new TypeError('OpenGraph card recorded without a title');

	return { label: typeof label === 'string' ? label : undefined, title };
}

function reportOutcomes(
	{ failures, fresh, rendered }: RenderCounts & { failures: Array<RenderFailure> },
	{
		missingImages,
		progress,
	}: { missingImages: PreparedCardRender['missingImages']; progress: Progress },
): void {
	const tally = `${formatCount(rendered)} generated, ${formatCount(fresh)} cached`;

	for (const { cards, path: imagePath } of missingImages) {
		log.warn(`Featured Image missing, drawn without art: ${imagePath} (${cards.join(', ')})`);
	}

	if (failures.length > 0) {
		progress.fail(tally);
		for (const { message, name } of failures) log.error(`${name}: ${message}`);
		throw new UserError(`${String(failures.length)} OpenGraph image(s) failed to render`);
	}

	progress.succeed(tally);
}

async function publish({ cards, directory }: PreparedCardRender, distPath: string) {
	const publishPath = path.join(distPath, openGraphBasePath);

	await mkdir(publishPath, { recursive: true });

	for (const name of cards) {
		await copyFile(path.join(directory, name), path.join(publishPath, name));
	}

	return publishPath;
}

await runCommand({
	name: 'og-image',
	run: async ({ paths, signal }) => {
		const { distPath } = paths;
		const renderCard = await createCardRenderer();
		const render = await prepareCardRender({
			decode: (source) => decodeImage(source.filePath),
			distPath,
			missingImage: 'omit',
			render: (input, image) => renderCard(toCardInput(input), image),
			storePath: paths.imageCachePath,
			templateVersion,
		});
		const progress = createProgress({ label: 'Cards', total: render.total });
		const counts = await render.run({
			onFailure: 'report',
			onProgress: () => {
				progress.tick();
			},
			signal,
		});

		reportOutcomes(counts, { missingImages: render.missingImages, progress });

		const publishPath = await publish(render, distPath);

		log.data(
			{
				generated: counts.rendered,
				missingImages: render.missingImages,
				outputPath: publishPath,
				published: render.cards.length,
				reused: counts.fresh,
			},
			() =>
				`${String(counts.rendered)} generated, ${String(counts.fresh)} cached; ${String(render.cards.length)} published → ${publishPath}`,
		);
	},
	summary: 'Render the OpenGraph cards the build recorded and publish them into dist/',
	title: 'OpenGraph images',
});
