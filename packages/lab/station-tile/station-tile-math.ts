import type { RgbColor } from './station-tile-types.ts';

const clamp01 = (value: number): number => (value < 0 ? 0 : Math.min(value, 1));
const clamp255 = (value: number): number => (value < 0 ? 0 : Math.min(value, 255));

interface HslColor {
	h: number;
	l: number;
	s: number;
}

// Per-cell seed from a root seed and (col, row). Stable across grid resizes
export function cellSeed(rootSeed: number, col: number, row: number): number {
	return (rootSeed ^ Math.imul(col, 73_856_093) ^ Math.imul(row, 19_349_663)) >>> 0;
}

// Format a number for SVG output: up to 2 decimal places, no trailing zeros
export function formatSvgNumber(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	return Number.isSafeInteger(rounded) ? rounded.toString() : rounded.toFixed(2);
}

// Hash an arbitrary seed input to a uint32
export function hashSeed(seed: number | string): number {
	if (typeof seed === 'number') return seed >>> 0;
	return xmur3(seed);
}

// Apply small HSL deltas. Hue in degrees, sat/lit in absolute units
export function jitterHsl(rgb: RgbColor, dH: number, dS: number, dL: number): RgbColor {
	const hsl = rgbToHsl(rgb);
	return hslToRgb({
		h: hsl.h + dH,
		l: clamp01(hsl.l + dL),
		s: clamp01(hsl.s + dS),
	});
}

// Perceptually-reasonable lerp through linear light space
export function lerp(colorA: RgbColor, colorB: RgbColor, amount: number): RgbColor {
	const t = clamp01(amount);
	const aR = srgbToLinear(colorA.r);
	const aG = srgbToLinear(colorA.g);
	const aB = srgbToLinear(colorA.b);
	const bR = srgbToLinear(colorB.r);
	const bG = srgbToLinear(colorB.g);
	const bB = srgbToLinear(colorB.b);
	return {
		b: linearToSrgb(aB + (bB - aB) * t),
		g: linearToSrgb(aG + (bG - aG) * t),
		r: linearToSrgb(aR + (bR - aR) * t),
	};
}

// mulberry32: fast deterministic PRNG; returns a function yielding floats in [0, 1]
export function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return function next(): number {
		state = (state + 0x6d_2b_79_f5) >>> 0;
		let result = state;
		result = Math.imul(result ^ (result >>> 15), result | 1);
		result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
		return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
	};
}

export function parseHex(input: string): RgbColor {
	const normalized = input.trim().replace(/^#/, '');
	let full = normalized;
	if (normalized.length === 3) {
		full = '';
		for (let index = 0; index < normalized.length; index += 1) {
			const char = normalized.charAt(index);
			full += char + char;
		}
	}
	if (full.length !== 6) throw new Error(`Invalid hex color: ${input}`);
	const value = Number.parseInt(full, 16);
	return {
		b: value & 0xff,
		g: (value >> 8) & 0xff,
		r: (value >> 16) & 0xff,
	};
}

// Shift only lightness
export function shiftLightness(rgb: RgbColor, delta: number): RgbColor {
	const hsl = rgbToHsl(rgb);
	return hslToRgb({ h: hsl.h, l: clamp01(hsl.l + delta), s: hsl.s });
}

// Symmetric random in [-1, 1]
export function signed(rnd: () => number): number {
	return rnd() * 2 - 1;
}

export function toHex(rgb: RgbColor): string {
	const r = Math.round(clamp255(rgb.r));
	const g = Math.round(clamp255(rgb.g));
	const b = Math.round(clamp255(rgb.b));
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hslToRgb(hsl: HslColor): RgbColor {
	const h = (((hsl.h % 360) + 360) % 360) / 360;
	const s = clamp01(hsl.s);
	const l = clamp01(hsl.l);
	if (s === 0) return { b: l * 255, g: l * 255, r: l * 255 };
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return {
		b: hue2rgb(p, q, h - 1 / 3) * 255,
		g: hue2rgb(p, q, h) * 255,
		r: hue2rgb(p, q, h + 1 / 3) * 255,
	};
}

function hue2rgb(p: number, q: number, tInput: number): number {
	let t = tInput;
	if (t < 0) t += 1;
	if (t > 1) t -= 1;
	if (t < 1 / 6) return p + (q - p) * 6 * t;
	if (t < 1 / 2) return q;
	if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}

// Linear light → sRGB channel
function linearToSrgb(value: number): number {
	const clamped = clamp01(value);
	const srgb = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
	return srgb * 255;
}

function rgbToHsl(rgb: RgbColor): HslColor {
	const r = rgb.r / 255;
	const g = rgb.g / 255;
	const b = rgb.b / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, l, s: 0 };
	const delta = max - min;
	const s = delta / (l > 0.5 ? 2 - max - min : max + min);
	let h: number;
	if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / delta + 2) / 6;
	else h = ((r - g) / delta + 4) / 6;
	return { h: h * 360, l, s };
}

function srgbToLinear(channel: number): number {
	const value = channel / 255;
	return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

// xmur3: hash a string into a uint32 seed
function xmur3(str: string): number {
	let hash = 2_166_136_261;
	for (let index = 0; index < str.length; index += 1) {
		hash = Math.imul(hash ^ (str.codePointAt(index) ?? 0), 3_432_918_353);
		hash = (hash << 13) | (hash >>> 19);
	}
	hash = Math.imul(hash ^ (hash >>> 16), 2_246_822_507);
	hash = Math.imul(hash ^ (hash >>> 13), 3_266_489_909);
	return (hash ^ (hash >>> 16)) >>> 0;
}
