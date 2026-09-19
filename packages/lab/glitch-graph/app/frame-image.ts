import type { IntBuffer } from '@thi.ng/pixel';

import { frameFromRgba, frameToRgba } from '../engine/frame.ts';

const workingLongEdge = 768;

// `createImageBitmap` already applies EXIF orientation, so rotating again would double it
export async function decodeImage(blob: Blob) {
	const decoded = await createImageBitmap(blob);
	const scale = Math.min(1, workingLongEdge / Math.max(decoded.width, decoded.height));
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
	decoded.close();
	bitmap.close();

	return frameFromRgba(context.getImageData(0, 0, width, height).data, width, height);
}

export async function frameToObjectUrl(frame: IntBuffer) {
	const { height, width } = frame;
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext('2d');

	if (context === null) throw new Error('2D canvas is unavailable');

	context.putImageData(
		new ImageData(new Uint8ClampedArray(frameToRgba(frame)), width, height),
		0,
		0,
	);

	return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/png' }));
}
