# AGENTS.md

## Project Overview

A Node.js CLI tool that scaffolds React component files into organized module folders. It supports both TypeScript (`.tsx`) and JavaScript (`.jsx`) components, generates barrel `index` files, and handles multi-component modules gracefully.

Project name: `mkrc-ts` (short for "make React component with TypeScript")
CLI name: `mknrc` (short for "make new React component")

---

## npm Packages

| Package | Purpose |
|---|---|
| `commander` | CLI argument/option parsing and subcommand structure |
| `@clack/prompts` | Interactive prompts and cancellation-aware prompt flow |
| `ora` | Spinner for generation progress |
| `boxen` | Styled boxed terminal sections (intro + summary) |
| `chalk` | Terminal color styling |
| `fs-extra` | Enhanced file system operations (`ensureDir`, `pathExists`, etc.) |

> The CLI runs directly via Node.js with an `#!/usr/bin/env node` shebang in `bin/index.js`.

---

## Architecture

```
mkrc-ts/
├── bin/
│   └── index.js          # CLI entry point (shebang + commander setup)
├── src/
│   commands/
│   │   └── create.js     # "create" command handler + UX rendering
│   └── lib/
│       ├── prompts.js    # @clack/prompts prompt definitions
│       ├── generator.js  # Core file generation logic (returns structured result)
│       └── templates.js  # Component + barrel file templates
├── test/
│   └── generator.test.js # Node test runner tests for generator behavior
├── Makefile
├── package.json
└── AGENTS.md
```

---

## CLI Interface

```bash
mknrc create
# Launches interactive prompts

mknrc create --module Dashboard --component Widget --lang tsx
# Direct flags, skips prompts
```

### Prompts (via `@clack/prompts`)

1. **Module name** — the folder name (e.g. `Dashboard`).
2. **Component name** — defaults to module name if not provided.
3. **Language** — `tsx` or `jsx`.

### Terminal UX

- `intro()` heading from `@clack/prompts`
- intro/summary content wrapped with `boxen`
- generation progress spinner via `ora`
- final `outro()` success line

---

## Interrupt & Cancel Handling

The create flow handles user interruption gracefully:

- `Ctrl+C` (`SIGINT`) exits safely with code `130`
- `Ctrl+X` (control char `\u0018`) exits safely with code `130`
- Prompt cancellation from `@clack/prompts` returns a clean cancel message

---

## Multi-Component Module Design

A module folder can contain multiple component files. The folder name represents the feature/domain, not a single component.

**Example structure:**
```
Dashboard/
├── Dashboard.tsx
├── DashboardHeader.tsx
├── DashboardChart.tsx
└── index.ts
```

### Rules

- The folder is created with `fs-extra.ensureDir()`.
- Each component gets its own `.tsx`/`.jsx` file named after the component.
- The barrel `index.ts`/`index.js` is additive when module already exists.
- Existing component files are never overwritten.

### Barrel Strategy

On each `create` run:
1. Build target paths (`component` + `index`).
2. Create component file if missing.
3. Create barrel file when absent.
4. Otherwise append export line only when not already present.

---

## File Templates

### Component Template (`src/lib/templates.js`)

```js
export const componentTemplate = (name, lang) => `
import React from 'react';
${lang === 'tsx' ? `\ninterface ${name}Props {}\n` : ''}
const ${name}${lang === 'tsx' ? `: React.FC<${name}Props>` : ''} = () => {
  return (
    <div>
      <h1>${name}</h1>
    </div>
  );
};

export default ${name};
`.trimStart();
```

### Barrel Templates (`src/lib/templates.js`)

```js
export const barrelTemplate = (name) =>
  `export { default as ${name} } from './${name}';\n`;

export const barrelExportLine = (name) =>
  `export { default as ${name} } from './${name}';\n`;
```

---

## Core Generator Logic (`src/lib/generator.js`)

`createComponent(moduleName, componentName, lang)`:

1. Validate `lang` (`tsx`/`jsx`).
2. Resolve `<cwd>/<moduleName>/` and component/index paths.
3. `ensureDir(targetDir)`.
4. Detect mixed extension modules and accumulate warnings.
5. If component file exists: return a structured "skipped" result.
6. Write component file from template.
7. Create barrel file if missing.
8. If barrel exists, append export only when missing.
9. Return structured result for UI rendering (`componentCreated`, `componentSkipped`, `barrelCreated`, `barrelAppended`, `exportSkipped`, `warnings`, paths).

---

## Key Behaviours & Edge Cases

| Scenario | Behaviour |
|---|---|
| Folder already exists | `ensureDir` is a no-op — proceeds safely |
| Component file already exists | Skips creation; does not overwrite |
| Export already in index | Skips duplicate append |
| Module name === Component name | Valid |
| Module name !== Component name | Valid multi-component module |
| Mixed `tsx`/`jsx` in same module | Allowed but warning is returned/displayed |

---

## Testing

- Test framework: Node built-in test runner (`node --test`)
- Test file: `test/generator.test.js`
- Covered behaviors include:
  - TSX creation + `index.ts` barrel creation
  - append behavior for second component
  - duplicate component skip/no overwrite
  - JSX creation + `index.js`
  - mixed extension warning behavior

### Commands

```bash
npm test
make test
make test-watch
```

---

## package.json (key fields)

```json
{
  "name": "mkrc-ts",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "mknrc": "./bin/index.js"
  },
  "scripts": {
    "start": "node ./bin/index.js",
    "test": "node --test"
  }
}
```

---

## Implementation Notes for the Agent

- Use **ES Modules** (`"type": "module"`); use `import`/`export`, not `require()`.
- Keep `bin/index.js` thin; parse args with `commander` and delegate to `src/commands/create.js`.
- Keep templates pure in `src/lib/templates.js`.
- Keep generation side effects in `src/lib/generator.js`; return structured status instead of printing there.
- Keep CLI rendering concerns (spinner, boxed output, intro/outro, cancellation messages) in `src/commands/create.js`.
- All file I/O should use `fs-extra`.
