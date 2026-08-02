import chalk from 'chalk';
import { $ } from 'zx';

interface DeployAppOptions {
	dryRun?: boolean;
	rootPath: string;
}

export async function deployApp(options: DeployAppOptions): Promise<void> {
	const { dryRun = false, rootPath } = options;

	console.log(chalk.blue('Deploying to Cloudflare Workers...'));
	if (dryRun) console.log(chalk.yellow('  DRY RUN'));

	const start = Date.now();

	// wrangler.jsonc lives at the repo root; run from there so it resolves config + ./dist
	await $({ cwd: rootPath, stdio: 'inherit' })`wrangler deploy ${dryRun ? ['--dry-run'] : []}`;

	console.log(chalk.green(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`));
}
