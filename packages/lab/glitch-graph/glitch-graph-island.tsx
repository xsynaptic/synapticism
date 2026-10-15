import { lazy, Suspense, useSyncExternalStore } from 'react';

import { ErrorBoundary } from '#glitch-graph/error-boundary.tsx';

interface GlitchGraphIslandProps {
	className?: string | undefined;
}

// React Flow, Base UI, thi.ng and ELK stay out of the hydration bundle until the island is visible
const GlitchGraphApp = lazy(() => import('#glitch-graph/app/glitch-graph-app.tsx'));

const frameWidth = 'min(100vw - 2rem, 88rem)';

// The stylesheet arrives with the lazy chunk, so the frame is inline: wider than the prose column it sits in, and as tall as the toolbar, `.gg-workspace` and the border so the page below never moves
const frameStyle = {
	marginInline: `calc(50% - ${frameWidth} / 2)`,
	minHeight: 'calc(clamp(34rem, 100svh - 8rem, 56rem) + 3rem + 2px)',
	width: frameWidth,
};

const placeholder = <p>Loading the glitch graph…</p>;

// Unstyled on purpose: a chunk that failed to load brought no stylesheet with it
const failureNotice = (
	<p role="alert">The glitch graph could not start. Reload the page to try again.</p>
);

export default function GlitchGraphIsland({ className }: GlitchGraphIslandProps) {
	const isClient = useIsClient();

	return (
		<div
			className={className === undefined ? 'glitch-graph' : `glitch-graph ${className}`}
			style={frameStyle}
		>
			{isClient ? (
				<ErrorBoundary fallback={failureNotice}>
					<Suspense fallback={placeholder}>
						<GlitchGraphApp />
					</Suspense>
				</ErrorBoundary>
			) : (
				placeholder
			)}
		</div>
	);
}

function subscribe() {
	return unsubscribe;
}

function unsubscribe() {
	// Nothing to release; the snapshot never changes after mount
}

// Server snapshot is false, so hydration matches the placeholder before the app mounts
function useIsClient() {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
}
