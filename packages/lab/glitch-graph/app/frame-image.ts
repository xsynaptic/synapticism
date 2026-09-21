import { frameFromRgba } from '#glitch-graph/engine/frame.ts';

const previewLongEdge = 512;

const workingLongEdge = 1024;

// `createImageBitmap` already applies EXIF orientation, so rotating again would double it
export async function decodeImage(blob: Blob) {
	const decoded = await createImageBitmap(blob);
	const source = await toFrame(decoded, workingLongEdge);
	const preview = await toFrame(decoded, previewLongEdge);

	decoded.close();

	return { preview, source };
}

async function toFrame(decoded: ImageBitmap, longEdge: number) {
	const scale = Math.min(1, longEdge / Math.max(decoded.width, decoded.height));
	const bitmap =
		scale < 1
			? await createImageBitmap(decoded, {
					resizeHeight: Math.round(decoded.height * scale),
					resizeQuality: 'high',
					resizeWidth: Math.round(decoded.width * scale),
				})
			: decoded;
	const { height, width } = bitmap;
	const context = new OffscreenCanvas(width, height).getContext('2d');

	if (context === null) throw new Error('2D canvas is unavailable');

	context.drawImage(bitmap, 0, 0);

	if (bitmap !== decoded) bitmap.close();

	return frameFromRgba(context.getImageData(0, 0, width, height).data, width, height);
}
