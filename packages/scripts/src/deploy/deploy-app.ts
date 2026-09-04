import chalk from 'chalk';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { $ } from 'zx';

// Cloudflare Workers allows 20,000 assets per version and 25 MiB per asset
// wrangler's own `Read N files` line counts directories too, so it runs ahead of this count
const fileCountError = 19_500;
const fileCountWarn = 15_000;
const assetSizeWarn = 25 * 1024 * 1024;

interface DeployAppOptions {
	dryRun?: boolean;
	rootPath: string;
}

interface DistFile {
	relativePath: string;
	size: number;
}

export async function deployApp(options: DeployAppOptions): Promise<void> {
	const { dryRun = false, rootPath } = options;

	const distPath = path.join(rootPath, 'dist');

	if (!existsSync(distPath)) {
		throw new Error(`dist/ not found at ${distPath}. Run \`pnpm build\` (or omit --skip-build).`);
	}

	const files = await readDistFiles(distPath);

	console.log(chalk.blue('Deploying to Cloudflare Workers...'));
	console.log(chalk.gray(`  Assets: ${String(files.length)}`));

	checkAssetLimits(files);

	if (dryRun) console.log(chalk.yellow('  DRY RUN'));

	const start = Date.now();

	// wrangler.jsonc lives at the repo root; run from there so it resolves config + ./dist
	await $({
		cwd: rootPath,
		stdio: 'inherit',
	})`pnpm exec wrangler deploy ${dryRun ? ['--dry-run'] : []}`;

	console.log(chalk.green(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`));
}

function checkAssetLimits(files: Array<DistFile>): void {
	if (files.length >= fileCountError) {
		throw new Error(
			`dist/ has ${String(files.length)} files, over the ${String(fileCountError)} safety threshold (Workers cap is 20,000/version).`,
		);
	}

	if (files.length >= fileCountWarn) {
		console.log(
			chalk.yellow(`  Warning: ${String(files.length)} files approaches the 20,000 Workers cap`),
		);
	}

	for (const file of files) {
		if (file.size < assetSizeWarn) continue;

		const mib = (file.size / 1024 / 1024).toFixed(1);

		console.log(
			chalk.yellow(`  Warning: ${file.relativePath} is ${mib} MiB (25 MiB per-asset limit)`),
		);
	}
}

async function readDistFiles(distPath: string): Promise<Array<DistFile>> {
	const relativePaths = await fs.readdir(distPath, { recursive: true });

	const entries = await Promise.all(
		relativePaths.map(async (relativePath) => {
			const stat = await fs.stat(path.join(distPath, relativePath));

			return { isFile: stat.isFile(), relativePath, size: stat.size };
		}),
	);

	return entries.filter((entry) => entry.isFile);
}
