import type { SupportProbe } from '#emoji-picker/core/support-probes.ts';

import { pickerStore } from '#emoji-picker/client/emoji-picker-store.ts';
import { probeSupportedVersion } from '#emoji-picker/client/search-client.ts';
import { whenIdle } from '#emoji-picker/client/when-idle.ts';
import { toneFor } from '#emoji-picker/core/tones.ts';

let supportProbed = false;

function readProbes(element: HTMLElement): Array<SupportProbe> {
	try {
		return JSON.parse(element.dataset.probes ?? '[]') as Array<SupportProbe>;
	} catch {
		return [];
	}
}

export function isUnsupported(version: string | undefined) {
	return Number(version) > pickerStore.getState().supportedVersion;
}

export function versionShown(cell: HTMLButtonElement) {
	const isToned =
		cell.dataset.skins !== undefined &&
		toneFor(pickerStore.getState(), cell.dataset.hexcode ?? '') > 0;

	return (isToned ? cell.dataset.skinVersion : undefined) ?? cell.dataset.version;
}

export function markUnsupported(cells: Map<string, HTMLButtonElement>) {
	for (const cell of cells.values()) {
		cell.classList.toggle('ep-unsupported', isUnsupported(versionShown(cell)));
	}
}

export function probeSupport(root: HTMLElement, cells: Map<string, HTMLButtonElement>) {
	if (supportProbed) {
		markUnsupported(cells);
		return;
	}

	whenIdle(() => {
		const sample = cells.values().next().value;

		if (!sample) return;

		supportProbed = true;
		void probeSupportedVersion(readProbes(root), getComputedStyle(sample).fontFamily).then(
			(supportedVersion) => {
				pickerStore.setState({ supportedVersion });
			},
		);
	});
}
