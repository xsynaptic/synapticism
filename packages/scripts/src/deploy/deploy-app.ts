import { log, runSubprocess, UserError } from '@xsynaptic/astro-scripts';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

// Cloudflare Workers allows 20,000 assets per version and 25 MiB per asset
// wrangler's own `Read N files` line counts directories too, so it runs ahead of this count
const fileCountError = 19_500;
const fileCountWarn = 15_000;
const assetSizeWarn = 25 * 1024 * 1024;

interface DeployAppOptions {
	distPath: string;
	dryRun: boolean;
	rootPath: string;
}

interface DistFile {
	relativePath: string;
	size: number;
}

export async function deployApp({ distPath, dryRun, rootPath }: DeployAppOptions) {
	if (!existsSync(distPath)) {
		throw new UserError(`dist/ not found at ${distPath}`, {
			detail: 'Run `pnpm build` first',
		});
	}

	const files = await readDistFiles(distPath);

	checkAssetLimits(files);

	// wrangler.jsonc lives at the repo root; run from there so it resolves config + ./dist
	await runSubprocess(
		dryRun ? 'Deploying to Cloudflare Workers (dry run)' : 'Deploying to Cloudflare Workers',
		['pnpm', 'exec', 'wrangler', 'deploy', ...(dryRun ? ['--dry-run'] : [])],
		{ cwd: rootPath, onLine: isWranglerSummaryLine },
	);

	return { assets: files.length };
}

function checkAssetLimits(files: Array<DistFile>) {
	if (files.length >= fileCountError) {
		throw new UserError(
			`dist/ has ${String(files.length)} files, over the ${String(fileCountError)} safety threshold (Workers cap is 20,000/version)`,
		);
	}

	if (files.length >= fileCountWarn) {
		log.warn(`${String(files.length)} files approaches the 20,000 Workers cap`);
	}

	for (const file of files) {
		if (file.size < assetSizeWarn) continue;

		const mib = (file.size / 1024 / 1024).toFixed(1);

		log.warn(`${file.relativePath} is ${mib} MiB (25 MiB per-asset limit)`);
	}
}

// wrangler has no flag for its per-asset `+ path` lines; `--log-level warn` would take the deploy summary with them
function isWranglerSummaryLine(line: string) {
	return !line.startsWith('+ /') && !line.includes('truncating changed assets log');
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
