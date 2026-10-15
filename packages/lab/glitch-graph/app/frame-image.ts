import { frameFromRgba } from '#glitch-graph/engine/frame.ts';

export const resolutions = [512, 1024, 2048] as const;

export const defaultResolution = 1024;

// `createImageBitmap` already applies EXIF orientation, so rotating again would double it
export async function decodeImage(blob: Blob, longEdge: number) {
	const decoded = await createImageBitmap(blob);
	const source = await toSource(decoded, longEdge);

	decoded.close();

	return source;
}

// The review surface shows what the engine sees, so the image comes off the same canvas as the frame
async function toSource(decoded: ImageBitmap, longEdge: number) {
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
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext('2d');

	if (context === null) throw new Error('2D canvas is unavailable');

	context.drawImage(bitmap, 0, 0);

	if (bitmap !== decoded) bitmap.close();

	const frame = frameFromRgba(context.getImageData(0, 0, width, height).data, width, height);

	return { frame, image: await canvas.convertToBlob() };
}
