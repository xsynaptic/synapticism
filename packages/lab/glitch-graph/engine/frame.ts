import { ABGR8888, IntBuffer } from '@thi.ng/pixel';

// ABGR8888 over RGBA bytes assumes a little-endian host, which every shipping browser is
export function frameFromRgba(bytes: Uint8ClampedArray, width: number, height: number) {
	return new IntBuffer(
		width,
		height,
		ABGR8888,
		new Uint32Array(bytes.buffer, bytes.byteOffset, width * height),
	);
}

export function frameToRgba(frame: IntBuffer) {
	return new Uint8ClampedArray(frame.data.buffer, frame.data.byteOffset, frame.data.length * 4);
}

export function getLuma(pixel: number) {
	return (
		0.2126 * (pixel & 0xff) + 0.7152 * ((pixel >>> 8) & 0xff) + 0.0722 * ((pixel >>> 16) & 0xff)
	);
}

export function wrap(value: number, size: number) {
	return ((value % size) + size) % size;
}
