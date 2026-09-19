import type { IntBuffer } from '@thi.ng/pixel';

export function mergeByMask(branchA: IntBuffer, branchB: IntBuffer, mask: Uint8Array) {
	const output = branchA.copy();

	let index = 0;

	for (const isSet of mask) {
		if (isSet === 0) output.data[index] = branchB.data[index] ?? 0;
		index++;
	}

	return output;
}
