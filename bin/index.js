#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from '../src/commands/create.js';
const program = new Command();
program
    .name('mknrc')
    .description('Scaffold React components into feature module folders')
    .version('1.0.0');
program
    .command('create')
    .description('Create a React component inside a module folder')
    .option('-m, --module <name>', 'module/folder name')
    .option('-c, --component <name>', 'component file name (defaults to module name)')
    .option('-l, --lang <lang>', 'component language: tsx or jsx')
    .action(async (options) => {
        await createCommand(options);
    });
program.parseAsync(process.argv);
