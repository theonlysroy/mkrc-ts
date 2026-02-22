import chalk from 'chalk';
import { createComponent } from '../lib/generator.js';
import { promptForCreateInputs } from '../lib/prompts.js';

const VALID_LANGS = new Set(['tsx', 'jsx']);

export async function createCommand(options = {}) {
  const prefilled = {
    moduleName: sanitizeInput(options.module),
    componentName: sanitizeInput(options.component),
    lang: sanitizeInput(options.lang)?.toLowerCase(),
  };

  if (prefilled.lang && !VALID_LANGS.has(prefilled.lang)) {
    console.error(chalk.red(`Invalid language "${prefilled.lang}". Use "tsx" or "jsx".`));
    process.exitCode = 1;
    return;
  }

  const shouldPrompt = !prefilled.moduleName || !prefilled.lang;
  const answers = shouldPrompt ? await promptForCreateInputs(prefilled) : prefilled;

  const moduleName = answers.moduleName;
  const componentName = answers.componentName || answers.moduleName;
  const lang = answers.lang;

  await createComponent(moduleName, componentName, lang);
}

function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
