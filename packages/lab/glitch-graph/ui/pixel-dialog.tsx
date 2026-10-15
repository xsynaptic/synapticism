import type { ReactNode, RefObject } from 'react';

import { Dialog } from '@base-ui/react/dialog';
import { useEffect, useRef } from 'react';

import { usePortalContainer } from '#glitch-graph/ui/portal-container.ts';

interface PanOrigin {
	left: number;
	top: number;
	x: number;
	y: number;
}

export function PixelDialog({ children, title }: { children: ReactNode; title: string }) {
	const container = usePortalContainer();

	return (
		<Dialog.Portal container={container}>
			<Dialog.Backdrop className="gg-dialog-backdrop" />
			<Dialog.Popup className="gg-dialog-popup">
				<Dialog.Title className="gg-node-title">{title}</Dialog.Title>
				{children}
				<Dialog.Close className="gg-button">Close</Dialog.Close>
			</Dialog.Popup>
		</Dialog.Portal>
	);
}

// One image pixel per screen pixel: the only truthful way to read a pixel-scale effect
export function PixelViewer({ label, src }: { label: string; src: string }) {
	const paneRef = useRef<HTMLDivElement>(null);

	usePanning(paneRef);

	return (
		<>
			<p className="gg-note">Actual pixels</p>
			<div className="gg-viewer nowheel" ref={paneRef}>
				<img alt={label} className="gg-viewer-image" src={src} />
			</div>
		</>
	);
}

// Drag to pan is the Lightroom convention; touch keeps the browser's own scrolling
function usePanning(paneRef: RefObject<HTMLDivElement | null>) {
	useEffect(() => {
		const pane = paneRef.current;

		if (pane === null) return;

		let origin: PanOrigin | undefined;

		// Arrow consts rather than declarations, which would not keep `pane` narrowed
		const startPan = (event: PointerEvent) => {
			if (event.button !== 0 || event.pointerType === 'touch') return;

			origin = { left: pane.scrollLeft, top: pane.scrollTop, x: event.clientX, y: event.clientY };
			pane.setPointerCapture(event.pointerId);
			pane.dataset.panning = 'true';
		};

		const movePan = (event: PointerEvent) => {
			if (origin === undefined) return;

			pane.scrollLeft = origin.left - (event.clientX - origin.x);
			pane.scrollTop = origin.top - (event.clientY - origin.y);
		};

		const endPan = () => {
			origin = undefined;

			delete pane.dataset.panning;
		};

		pane.addEventListener('pointerdown', startPan);
		pane.addEventListener('pointermove', movePan);
		pane.addEventListener('pointerup', endPan);
		pane.addEventListener('pointercancel', endPan);

		return () => {
			pane.removeEventListener('pointerdown', startPan);
			pane.removeEventListener('pointermove', movePan);
			pane.removeEventListener('pointerup', endPan);
			pane.removeEventListener('pointercancel', endPan);
		};
	}, [paneRef]);
}
