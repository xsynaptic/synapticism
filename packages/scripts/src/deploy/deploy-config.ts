import chalk from 'chalk';

interface DeployConfig {
	remoteHost: string;
	sitePath: string;
	sshKeyPath: string;
}

export function loadDeployConfig(): DeployConfig {
	const remoteHost = process.env.DEPLOY_REMOTE_HOST;
	const sshKeyPath = process.env.DEPLOY_SSH_KEY_PATH;
	const sitePath = process.env.DEPLOY_SITE_PATH;

	const missing: Array<string> = [];

	if (!remoteHost) missing.push('DEPLOY_REMOTE_HOST');
	if (!sshKeyPath) missing.push('DEPLOY_SSH_KEY_PATH');
	if (!sitePath) missing.push('DEPLOY_SITE_PATH');

	if (!remoteHost || !sshKeyPath || !sitePath) {
		console.error(chalk.red(`Missing required environment variables: ${missing.join(', ')}`));
		console.error(chalk.gray('\nCheck deploy/.env or deploy/.env.example for required vars.'));
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}

	return {
		remoteHost,
		sitePath,
		sshKeyPath,
	};
}

export function printDeployConfig(config: DeployConfig) {
	console.log(chalk.blue('Deploy Configuration:'));
	console.log(chalk.gray(`  Remote:     ${config.remoteHost}`));
	console.log(chalk.gray(`  Site path:  ${config.sitePath}`));
	console.log('');
}
