import type { AstroIntegration } from 'astro';

interface GlitchGraphOptions {
	entrypoint?: string;
	route?: string;
}

export default function devGlitchGraph({
	entrypoint = './src/dev/glitch-graph/glitch-graph.astro',
	route = '/glitch-graph-dev',
}: GlitchGraphOptions = {}): AstroIntegration {
	return {
		hooks: {
			'astro:config:setup': ({ command, injectRoute }) => {
				if (command !== 'dev') return;

				injectRoute({ entrypoint, pattern: route });
			},
		},
		name: 'dev-glitch-graph',
	};
}
