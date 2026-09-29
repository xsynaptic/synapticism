// Per-cell seed from a root seed and (col, row). Stable across grid resizes
export function cellSeed(rootSeed: number, col: number, row: number): number {
	return (rootSeed ^ Math.imul(col, 73_856_093) ^ Math.imul(row, 19_349_663)) >>> 0;
}

export function hashSeed(seed: number | string): number {
	if (typeof seed === 'number') return seed >>> 0;
	return xmur3(seed);
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

// Symmetric random in [-1, 1]
export function signed(rnd: () => number): number {
	return rnd() * 2 - 1;
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
