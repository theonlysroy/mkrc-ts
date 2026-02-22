import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { barrelExportLine, barrelTemplate, componentTemplate } from './templates.js';

const SUPPORTED_LANGS = new Set(['tsx', 'jsx']);

export async function createComponent(moduleName, componentName, lang) {
  if (!SUPPORTED_LANGS.has(lang)) {
    throw new Error(`Unsupported lang "${lang}". Expected "tsx" or "jsx".`);
  }

  const targetDir = path.resolve(process.cwd(), moduleName);
  const componentPath = path.join(targetDir, `${componentName}.${lang}`);
  const indexExt = lang === 'tsx' ? 'ts' : 'js';
  const indexPath = path.join(targetDir, `index.${indexExt}`);
  const exportLine = barrelExportLine(componentName);

  await fs.ensureDir(targetDir);
  console.log(chalk.blue(`Module ready: ${targetDir}`));

  await warnOnMixedExtensions(targetDir, lang);

  if (await fs.pathExists(componentPath)) {
    console.log(chalk.yellow(`Skipped: ${path.relative(process.cwd(), componentPath)} already exists.`));
    return;
  }

  await fs.writeFile(componentPath, componentTemplate(componentName, lang), 'utf8');
  console.log(chalk.green(`Created component: ${path.relative(process.cwd(), componentPath)}`));

  if (!(await fs.pathExists(indexPath))) {
    await fs.writeFile(indexPath, barrelTemplate(componentName), 'utf8');
    console.log(chalk.green(`Created barrel: ${path.relative(process.cwd(), indexPath)}`));
    return;
  }

  const existingIndex = await fs.readFile(indexPath, 'utf8');
  if (existingIndex.includes(exportLine)) {
    console.log(chalk.yellow(`Skipped export: ${componentName} is already in ${path.relative(process.cwd(), indexPath)}.`));
    return;
  }

  const prefix = existingIndex.endsWith('\n') || existingIndex.length === 0 ? '' : '\n';
  await fs.appendFile(indexPath, `${prefix}${exportLine}`, 'utf8');
  console.log(chalk.green(`Appended export: ${path.relative(process.cwd(), indexPath)}`));
}

async function warnOnMixedExtensions(targetDir, lang) {
  const oppositeLang = lang === 'tsx' ? 'jsx' : 'tsx';
  const hasOpposite = await hasFilesWithExtension(targetDir, oppositeLang);

  if (hasOpposite) {
    console.log(
      chalk.yellow(
        `Warning: ${path.basename(targetDir)} already contains .${oppositeLang} files. Mixing .tsx/.jsx in one module is discouraged.`
      )
    );
  }
}

async function hasFilesWithExtension(targetDir, extension) {
  const files = await fs.readdir(targetDir);
  return files.some((file) => file.endsWith(`.${extension}`));
}
