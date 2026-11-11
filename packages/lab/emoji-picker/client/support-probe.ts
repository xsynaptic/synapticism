import type { SupportProbe } from '#emoji-picker/core/support-probes.ts';

const canvasSize = 32;

// From emoji-picker-element (Apache-2.0): colour glyphs ignore fillStyle; broken sequences draw too wide
function createGlyphTest(fontFamily: string) {
	const canvas = document.createElement('canvas');

	canvas.width = canvasSize;
	canvas.height = canvasSize;

	const context = canvas.getContext('2d', { willReadFrequently: true });

	if (!context) return;

	context.font = `${String(canvasSize * 0.75)}px ${fontFamily}`;
	context.textAlign = 'center';
	context.textBaseline = 'middle';

	const referenceWidth = context.measureText('😀').width;

	function sample(glyph: string, colour: string) {
		if (!context) return new Uint8ClampedArray();

		context.clearRect(0, 0, canvasSize, canvasSize);
		context.fillStyle = colour;
		context.fillText(glyph, canvasSize / 2, canvasSize / 2);

		return context.getImageData(0, 0, canvasSize, canvasSize).data;
	}

	return function drawsInColour(glyph: string) {
		if (context.measureText(glyph).width > referenceWidth * 1.5) return false;

		const dark = sample(glyph, '#000');
		const light = sample(glyph, '#fff');

		return (
			dark.some((value) => value !== 0) && dark.every((value, index) => value === light[index])
		);
	};
}

// Infinity when nothing passes: a device with no colour emoji font gives no basis for dimming
export function highestSupportedVersion(probes: Array<SupportProbe>, fontFamily: string) {
	const drawsInColour = createGlyphTest(fontFamily);

	if (!drawsInColour) return Infinity;

	return probes.find((probe) => drawsInColour(probe.emoji))?.version ?? Infinity;
}
