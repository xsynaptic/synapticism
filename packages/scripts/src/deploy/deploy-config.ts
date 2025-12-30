import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'node:path';

interface DeployConfig {
	remoteHost: string;
	sshKeyPath: string;
	sitePath: string;
}

export function loadDeployConfig(rootPath: string): DeployConfig {
	// Load env files
	dotenv.config({ path: path.join(rootPath, '.env') });
	dotenv.config({ path: path.join(rootPath, 'deploy/.env') });

	const remoteHost = process.env.DEPLOY_REMOTE_HOST;
	const sshKeyPath = process.env.DEPLOY_SSH_KEY_PATH;
	const sitePath = process.env.DEPLOY_SITE_PATH;

	// Validate required vars
	const missing: Array<string> = [];

	if (!remoteHost) missing.push('DEPLOY_REMOTE_HOST');
	if (!sshKeyPath) missing.push('DEPLOY_SSH_KEY_PATH');
	if (!sitePath) missing.push('DEPLOY_SITE_PATH');

	if (!remoteHost || !sshKeyPath || !sitePath) {
		console.error(chalk.red(`Missing required environment variables: ${missing.join(', ')}`));
		console.error(chalk.gray('\nExample .env configuration:'));
		console.error(chalk.gray('  DEPLOY_REMOTE_HOST=deploy@your-server.com'));
		console.error(chalk.gray('  DEPLOY_SSH_KEY_PATH=/path/to/ssh/key'));
		console.error(chalk.gray('  DEPLOY_SITE_PATH=/var/www/synapticism'));
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}

	return {
		remoteHost,
		sshKeyPath,
		sitePath,
	};
}

export function printDeployConfig(config: DeployConfig) {
	console.log(chalk.blue('Deploy Configuration:'));
	console.log(chalk.gray(`  Remote:     ${config.remoteHost}`));
	console.log(chalk.gray(`  Site path:  ${config.sitePath}`));
	console.log('');
}
