import chalk from 'chalk';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function safelyCreateDirectory(dir: string) {
	if (existsSync(dir)) return;

	mkdirSync(dir, { recursive: true });
	console.log(chalk.gray(`Created directory: ${chalk.cyan(dir)}`));
}

// Walk up the directory tree looking for `pnpm-workspace.yaml` to locate the monorepo root
// Cached at module load: scripts only ever run from one place per invocation
let cachedWorkspaceRoot: string | undefined;

export function findWorkspaceRoot(startDir: string = process.cwd()): string {
	if (cachedWorkspaceRoot) return cachedWorkspaceRoot;

	let current = path.resolve(startDir);

	while (current !== path.dirname(current)) {
		if (existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
			cachedWorkspaceRoot = current;
			return current;
		}

		current = path.dirname(current);
	}

	throw new Error(`Could not locate pnpm-workspace.yaml above ${startDir}`);
}
