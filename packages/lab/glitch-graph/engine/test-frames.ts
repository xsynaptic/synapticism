import { ABGR8888, IntBuffer } from '@thi.ng/pixel';

export function createFrame(width: number, height: number, pixels: Array<number>) {
	return new IntBuffer(width, height, ABGR8888, new Uint32Array(pixels));
}

export function createGradientFrame(width: number, height: number) {
	const frame = new IntBuffer(width, height, ABGR8888);

	for (let index = 0; index < width * height; index++) {
		const value = Math.round((index / (width * height - 1)) * 255);

		frame.data[index] = (0xff_00_00_00 | (value << 16) | ((255 - value) << 8) | value) >>> 0;
	}

	return frame;
}

export function createGray(value: number, alpha = 0xff) {
	return ((alpha << 24) | (value << 16) | (value << 8) | value) >>> 0;
}
