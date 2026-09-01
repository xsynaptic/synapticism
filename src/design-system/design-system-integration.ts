import type { AstroIntegration } from 'astro';

interface DesignSystemOptions {
	entrypoint?: string;
	route?: string;
}

export default function designSystem({
	entrypoint = './src/design-system/design-system.astro',
	route = '/design-system',
}: DesignSystemOptions = {}): AstroIntegration {
	return {
		hooks: {
			'astro:config:setup': ({ command, injectRoute }) => {
				if (command !== 'dev') return;

				injectRoute({ entrypoint, pattern: route });
			},
		},
		name: 'design-system',
	};
}
