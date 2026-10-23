import type { ReactNode } from 'react';

// Paths from Lucide (https://lucide.dev), ISC licensed

function IconSvg({ children }: { children: ReactNode }) {
	return (
		<svg
			aria-hidden="true"
			className="gg-icon"
			fill="none"
			height="24"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			width="24"
			xmlns="http://www.w3.org/2000/svg"
		>
			{children}
		</svg>
	);
}

export function CheckIcon() {
	return (
		<IconSvg>
			<path d="M20 6 9 17l-5-5" />
		</IconSvg>
	);
}

export function ChevronDownIcon() {
	return (
		<IconSvg>
			<path d="m6 9 6 6 6-6" />
		</IconSvg>
	);
}

export function DicesIcon() {
	return (
		<IconSvg>
			<rect height="12" rx="2" ry="2" width="12" x="2" y="10" />
			<path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" />
			<path d="M6 18h.01" />
			<path d="M10 14h.01" />
			<path d="M15 6h.01" />
			<path d="M18 9h.01" />
		</IconSvg>
	);
}

export function DownloadIcon() {
	return (
		<IconSvg>
			<path d="M12 15V3" />
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<path d="m7 10 5 5 5-5" />
		</IconSvg>
	);
}

export function EllipsisIcon() {
	return (
		<IconSvg>
			<circle cx="12" cy="12" r="1" />
			<circle cx="19" cy="12" r="1" />
			<circle cx="5" cy="12" r="1" />
		</IconSvg>
	);
}

export function EyeIcon() {
	return (
		<IconSvg>
			<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
			<circle cx="12" cy="12" r="3" />
		</IconSvg>
	);
}

export function ImagePlusIcon() {
	return (
		<IconSvg>
			<path d="M16 5h6" />
			<path d="M19 2v6" />
			<path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" />
			<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			<circle cx="9" cy="9" r="2" />
		</IconSvg>
	);
}

export function MaximizeIcon() {
	return (
		<IconSvg>
			<path d="M15 3h6v6" />
			<path d="m21 3-7 7" />
			<path d="m3 21 7-7" />
			<path d="M9 21H3v-6" />
		</IconSvg>
	);
}

export function MinimizeIcon() {
	return (
		<IconSvg>
			<path d="m14 10 7-7" />
			<path d="M20 10h-6V4" />
			<path d="m3 21 7-7" />
			<path d="M4 14h6v6" />
		</IconSvg>
	);
}

export function PlusIcon() {
	return (
		<IconSvg>
			<path d="M5 12h14" />
			<path d="M12 5v14" />
		</IconSvg>
	);
}

export function RedoIcon() {
	return (
		<IconSvg>
			<path d="m15 14 5-5-5-5" />
			<path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
		</IconSvg>
	);
}

export function UndoIcon() {
	return (
		<IconSvg>
			<path d="M9 14 4 9l5-5" />
			<path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
		</IconSvg>
	);
}

export function XIcon() {
	return (
		<IconSvg>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</IconSvg>
	);
}
