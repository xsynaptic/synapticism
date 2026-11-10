import type { GeneratedTile } from '#station-tile/core/render.ts';
import type { ExportFormat } from '#station-tile/station-tile-lab-controls.ts';

// The canvas viewBox is 768 wide, so a PNG at its natural size would be too small to use
const pngScale = 3;

export async function downloadTile(tile: GeneratedTile, format: ExportFormat, name: string) {
	const svg = new Blob([tile.svg], { type: 'image/svg+xml' });

	if (format === 'svg') {
		saveBlob(svg, `${name}.svg`);
		return;
	}

	saveBlob(await rasterize(svg, tile), `${name}.png`);
}

function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error('PNG encoding failed'));
				return;
			}

			resolve(blob);
		}, 'image/png');
	});
}

async function rasterize(svg: Blob, tile: GeneratedTile): Promise<Blob> {
	const url = URL.createObjectURL(svg);

	try {
		const image = new Image();

		image.src = url;
		await image.decode();

		const canvas = document.createElement('canvas');

		canvas.width = Math.round(tile.width * pngScale);
		canvas.height = Math.round(tile.height * pngScale);

		const context = canvas.getContext('2d');

		if (!context) throw new Error('Canvas 2D context unavailable');

		context.drawImage(image, 0, 0, canvas.width, canvas.height);

		return await encodePng(canvas);
	} finally {
		URL.revokeObjectURL(url);
	}
}

function saveBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = filename;
	link.click();

	// Safari can still be reading the blob after click returns; FileSaver.js waits 40 s for the same reason
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, 40_000);
}
