import { imageCachePath, mediaDir } from '@synapticism/shared/constants';
import { createCommandRunner } from '@xsynaptic/astro-scripts';
import path from 'node:path';

export interface ScriptPaths {
	imageCachePath: string;
	mediaPath: string;
}

function resolveScriptPaths(rootPath: string): ScriptPaths {
	return {
		imageCachePath: path.resolve(rootPath, imageCachePath),
		mediaPath: path.resolve(rootPath, mediaDir),
	};
}

export const { runCommand } = createCommandRunner({
	context: ({ rootPath }) => ({ paths: resolveScriptPaths(rootPath) }),
});
