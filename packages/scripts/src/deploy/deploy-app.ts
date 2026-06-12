import chalk from 'chalk';
import path from 'node:path';
import { $ } from 'zx';

import { loadDeployConfig } from './deploy-config.js';

interface DeployAppOptions {
	dryRun?: boolean;
	rootPath: string;
	skipDelete?: boolean;
}

export async function deployApp(options: DeployAppOptions): Promise<void> {
	const { dryRun = false, rootPath, skipDelete = false } = options;

	// Load deploy configuration
	const config = loadDeployConfig();

	const distPath = path.join(rootPath, 'dist');

	console.log(chalk.blue('Transferring app...'));
	console.log(chalk.gray(`  From: ${distPath}`));
	console.log(chalk.gray(`  To:   ${config.remoteHost}:${config.sitePath}`));

	if (dryRun) console.log(chalk.yellow('  DRY RUN'));

	const rsyncArgs = [
		'-avz',
		'--progress',
		'-e',
		`ssh -i ${config.sshKeyPath}`,
		...(skipDelete ? [] : ['--delete-after']),
		...(dryRun ? ['--dry-run'] : []),
		`${distPath}/`,
		`${config.remoteHost}:${config.sitePath}/`,
	];

	const start = Date.now();

	await $({ stdio: 'inherit' })`rsync ${rsyncArgs}`;

	console.log(chalk.green(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`));
}
