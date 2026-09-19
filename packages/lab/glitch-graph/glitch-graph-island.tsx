import { lazy, Suspense, useSyncExternalStore } from 'react';

interface GlitchGraphIslandProps {
	className?: string | undefined;
}

// React Flow, Base UI, thi.ng and ELK stay out of the hydration bundle until the island is visible
const GlitchGraphApp = lazy(() => import('./app/glitch-graph-app.tsx'));

// Matches the loaded app with an empty results panel at the site's content width
const reservedStyle = { minHeight: '60.9rem' };

const placeholder = <p>Loading the glitch graph…</p>;

export default function GlitchGraphIsland({ className }: GlitchGraphIslandProps) {
	const isClient = useIsClient();

	return (
		<div
			className={className === undefined ? 'glitch-graph' : `glitch-graph ${className}`}
			style={reservedStyle}
		>
			{isClient ? (
				<Suspense fallback={placeholder}>
					<GlitchGraphApp />
				</Suspense>
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
