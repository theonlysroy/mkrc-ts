import path from 'node:path';
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
  const warnings = [];

  await fs.ensureDir(targetDir);
  if (await hasMixedExtensions(targetDir, lang)) {
    warnings.push(
      `Warning: ${path.basename(targetDir)} already contains .${lang === 'tsx' ? 'jsx' : 'tsx'} files. Mixing .tsx/.jsx in one module is discouraged.`
    );
  }

  if (await fs.pathExists(componentPath)) {
    return {
      moduleName,
      componentName,
      lang,
      targetDir,
      componentPath,
      indexPath,
      componentCreated: false,
      componentSkipped: true,
      barrelCreated: false,
      barrelAppended: false,
      exportSkipped: false,
      warnings,
    };
  }

  await fs.writeFile(componentPath, componentTemplate(componentName, lang), 'utf8');

  if (!(await fs.pathExists(indexPath))) {
    await fs.writeFile(indexPath, barrelTemplate(componentName), 'utf8');
    return {
      moduleName,
      componentName,
      lang,
      targetDir,
      componentPath,
      indexPath,
      componentCreated: true,
      componentSkipped: false,
      barrelCreated: true,
      barrelAppended: false,
      exportSkipped: false,
      warnings,
    };
  }

  const existingIndex = await fs.readFile(indexPath, 'utf8');
  if (existingIndex.includes(exportLine)) {
    return {
      moduleName,
      componentName,
      lang,
      targetDir,
      componentPath,
      indexPath,
      componentCreated: true,
      componentSkipped: false,
      barrelCreated: false,
      barrelAppended: false,
      exportSkipped: true,
      warnings,
    };
  }

  const prefix = existingIndex.endsWith('\n') || existingIndex.length === 0 ? '' : '\n';
  await fs.appendFile(indexPath, `${prefix}${exportLine}`, 'utf8');
  return {
    moduleName,
    componentName,
    lang,
    targetDir,
    componentPath,
    indexPath,
    componentCreated: true,
    componentSkipped: false,
    barrelCreated: false,
    barrelAppended: true,
    exportSkipped: false,
    warnings,
  };
}

async function hasMixedExtensions(targetDir, lang) {
  const oppositeLang = lang === 'tsx' ? 'jsx' : 'tsx';
  const hasOpposite = await hasFilesWithExtension(targetDir, oppositeLang);
  return hasOpposite;
}

async function hasFilesWithExtension(targetDir, extension) {
  const files = await fs.readdir(targetDir);
  return files.some((file) => file.endsWith(`.${extension}`));
}
