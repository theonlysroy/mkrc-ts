import path from 'node:path';
import boxen from 'boxen';
import chalk from 'chalk';
import { cancel, intro, outro } from '@clack/prompts';
import ora from 'ora';
import { createComponent } from '../lib/generator.js';
import { promptForCreateInputs } from '../lib/prompts.js';

const VALID_LANGS = new Set(['tsx', 'jsx']);

export async function createCommand(options = {}) {
  const interrupt = registerInterruptHandlers();
  const prefilled = {
    moduleName: sanitizeInput(options.module),
    componentName: sanitizeInput(options.component),
    lang: sanitizeInput(options.lang)?.toLowerCase(),
  };

  try {
    intro(chalk.bold('mknrc'));
    console.log(
      boxen('Scaffold React components with clean module structure', {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
      })
    );

    if (prefilled.lang && !VALID_LANGS.has(prefilled.lang)) {
      cancel(chalk.red(`Invalid language "${prefilled.lang}". Use "tsx" or "jsx".`));
      process.exitCode = 1;
      return;
    }

    const shouldPrompt = !prefilled.moduleName || !prefilled.lang;
    const answers = shouldPrompt ? await promptForCreateInputs(prefilled) : prefilled;

    if (!answers) {
      cancel('Operation cancelled.');
      process.exitCode = 130;
      return;
    }

    const moduleName = answers.moduleName;
    const componentName = answers.componentName || answers.moduleName;
    const lang = answers.lang;

    const spinner = ora({ text: 'Generating component files...', spinner: 'dots' }).start();
    let result;
    try {
      result = await createComponent(moduleName, componentName, lang);
    } finally {
      spinner.stop();
    }

    printSummary(result);
    outro(chalk.green('Done.'));
  } catch (error) {
    cancel(chalk.red(error instanceof Error ? error.message : 'Failed to create component.'));
    process.exitCode = 1;
  } finally {
    interrupt.cleanup();
  }
}

function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function registerInterruptHandlers() {
  let handled = false;

  const handleSignal = (reason) => {
    if (handled) {
      return;
    }

    handled = true;
    cleanup();
    cancel(`${reason} detected. Exiting safely.`);
    process.exit(130);
  };

  const onSigint = () => handleSignal('Ctrl+C');
  const onData = (chunk) => {
    const input = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    if (input.includes('\u0018')) {
      handleSignal('Ctrl+X');
    }
  };

  const cleanup = () => {
    process.removeListener('SIGINT', onSigint);
    if (process.stdin?.isTTY) {
      process.stdin.removeListener('data', onData);
    }
  };

  process.on('SIGINT', onSigint);
  if (process.stdin?.isTTY) {
    process.stdin.on('data', onData);
  }

  return { cleanup };
}

function printSummary(result) {
  const lines = [];
  const componentRelPath = path.relative(process.cwd(), result.componentPath);
  const indexRelPath = path.relative(process.cwd(), result.indexPath);

  lines.push(chalk.bold(`Module: ${result.moduleName}`));

  if (result.componentSkipped) {
    lines.push(chalk.yellow(`Skipped: ${componentRelPath} already exists.`));
  } else {
    lines.push(chalk.green(`Created: ${componentRelPath}`));
  }

  if (result.barrelCreated) {
    lines.push(chalk.green(`Created barrel: ${indexRelPath}`));
  } else if (result.barrelAppended) {
    lines.push(chalk.green(`Updated barrel: ${indexRelPath}`));
  } else if (result.exportSkipped) {
    lines.push(chalk.yellow(`Skipped export in: ${indexRelPath}`));
  }

  for (const warning of result.warnings) {
    lines.push(chalk.yellow(warning));
  }

  console.log(
    boxen(lines.join('\n'), {
      padding: 1,
      borderStyle: 'round',
      borderColor: result.componentSkipped ? 'yellow' : 'green',
    })
  );
}
