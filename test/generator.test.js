import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { createComponent } from '../src/lib/generator.js';

async function withTempCwd(run) {
  const originalCwd = process.cwd();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mkrc-ts-test-'));

  try {
    process.chdir(tempDir);
    await run(tempDir);
  } finally {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  }
}

test('creates a tsx component and index.ts for a new module', { concurrency: false }, async () => {
  await withTempCwd(async (cwd) => {
    await createComponent('Dashboard', 'Widget', 'tsx');

    const componentPath = path.join(cwd, 'Dashboard', 'Widget.tsx');
    const indexPath = path.join(cwd, 'Dashboard', 'index.ts');

    assert.equal(await fs.pathExists(componentPath), true);
    assert.equal(await fs.pathExists(indexPath), true);

    const indexContent = await fs.readFile(indexPath, 'utf8');
    assert.match(indexContent, /export \{ default as Widget \} from '\.\/Widget';/);
  });
});

test('appends export line when adding another component in same module', { concurrency: false }, async () => {
  await withTempCwd(async (cwd) => {
    await createComponent('Dashboard', 'Widget', 'tsx');
    await createComponent('Dashboard', 'DashboardHeader', 'tsx');

    const indexPath = path.join(cwd, 'Dashboard', 'index.ts');
    const indexContent = await fs.readFile(indexPath, 'utf8');

    assert.match(indexContent, /default as Widget/);
    assert.match(indexContent, /default as DashboardHeader/);
  });
});

test('does not overwrite existing component files', { concurrency: false }, async () => {
  await withTempCwd(async (cwd) => {
    await createComponent('Dashboard', 'Widget', 'tsx');

    const componentPath = path.join(cwd, 'Dashboard', 'Widget.tsx');
    const originalContent = await fs.readFile(componentPath, 'utf8');

    await createComponent('Dashboard', 'Widget', 'tsx');

    const afterContent = await fs.readFile(componentPath, 'utf8');
    assert.equal(afterContent, originalContent);
  });
});

test('creates jsx component with index.js barrel', { concurrency: false }, async () => {
  await withTempCwd(async (cwd) => {
    await createComponent('Billing', 'BillingCard', 'jsx');

    const componentPath = path.join(cwd, 'Billing', 'BillingCard.jsx');
    const indexPath = path.join(cwd, 'Billing', 'index.js');

    assert.equal(await fs.pathExists(componentPath), true);
    assert.equal(await fs.pathExists(indexPath), true);

    const indexContent = await fs.readFile(indexPath, 'utf8');
    assert.match(indexContent, /export \{ default as BillingCard \} from '\.\/BillingCard';/);
  });
});
