import type { SupportProbe } from '#emoji-picker/core/support-probes.ts';

import { pickerStore } from '#emoji-picker/client/emoji-picker-store.ts';
import { highestSupportedVersion } from '#emoji-picker/client/support-probe.ts';
import { whenIdle } from '#emoji-picker/client/when-idle.ts';

let supportProbed = false;

function readProbes(element: HTMLElement): Array<SupportProbe> {
	try {
		return JSON.parse(element.dataset.probes ?? '[]') as Array<SupportProbe>;
	} catch {
		return [];
	}
}

export function markUnsupported(cells: Map<string, HTMLButtonElement>) {
	const { supportedVersion, tones } = pickerStore.getState();

	for (const [hexcode, cell] of cells) {
		const isToned = (tones[hexcode] ?? 0) > 0;
		const version = Number(
			(isToned ? cell.dataset.skinVersion : undefined) ?? cell.dataset.version,
		);

		cell.classList.toggle('ep-unsupported', version > supportedVersion);
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
		pickerStore.setState({
			supportedVersion: highestSupportedVersion(
				readProbes(root),
				getComputedStyle(sample).fontFamily,
			),
		});
	});
}
