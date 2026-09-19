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
