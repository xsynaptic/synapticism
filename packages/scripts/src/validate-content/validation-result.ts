import chalk from 'chalk';

export interface ValidationIssue {
	details?: Array<string>;
	message: string;
}

// `warn` findings are printed but do not fail the run
export interface ValidationResult {
	issues: Array<ValidationIssue>;
	status: 'fail' | 'pass' | 'warn';
	summary: string;
}

export function reportValidationResult({ issues, status, summary }: ValidationResult) {
	const color = status === 'fail' ? chalk.red : chalk.yellow;

	// The warning glyph is narrow, so it carries its own trailing space
	const marker = status === 'fail' ? '❌' : '⚠️ ';

	for (const issue of issues) {
		const details = issue.details ?? [];

		console.log(color(`${marker} ${issue.message}`));

		for (const detail of details) {
			console.log(color(`   ${detail}`));
		}
	}

	console.log(status === 'pass' ? chalk.green(`✓ ${summary}`) : chalk.yellow(`⚠️  ${summary}`));
}

export function toValidationResult(
	issues: Array<ValidationIssue>,
	summaries: { fail: string; pass: string },
): ValidationResult {
	if (issues.length === 0) return { issues: [], status: 'pass', summary: summaries.pass };

	return { issues, status: 'fail', summary: summaries.fail };
}
