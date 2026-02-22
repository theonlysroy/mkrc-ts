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
| `inquirer` | Interactive prompts (module name, component name, language) |
| `fs-extra` | Enhanced file system operations (`ensureDir`, `pathExists`, etc.) |
| `chalk` | Terminal output styling (success, error, info messages) |
| `prettier` | Optional: format generated files before writing |

> No build tools are needed. The CLI runs directly via Node.js with an `#!/usr/bin/env node` shebang. If TypeScript is used for the CLI source itself, add `tsx` or `ts-node` as a dev dependency.

---

## Architecture

```
mkrc-ts/
├── bin/
│   └── index.js          # CLI entry point (shebang + commander setup)
├── src/
│   commands/
│   │   └── create.js     # "create" command handler
│   └── lib/
│       ├── prompts.js    # Inquirer prompt definitions
│       ├── generator.js  # Core file generation logic
│       └── templates.js  # Component + barrel file templates
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

### Prompts (via `inquirer`)

1. **Module name** — the folder name (e.g. `Dashboard`). This is the feature/domain folder.
2. **Component name** — the React component file name (e.g. `Widget`). Defaults to module name if not provided.
3. **Language** — choice between `tsx` (TypeScript) or `jsx` (JavaScript).

---

## Multi-Component Module Design

A module folder can contain multiple component files. The folder name represents the **feature/domain**, not a single component.

**Example structure:**
```
Dashboard/
├── Dashboard.tsx       ← default component (matches folder)
├── DashboardHeader.tsx ← additional component
├── DashboardChart.tsx  ← additional component
└── index.ts            ← barrel file — re-exports all components
```

### Rules

- The folder is created once using `fs-extra.ensureDir()` — safe to call multiple times, no error if it already exists.
- Each component gets its own `.tsx` / `.jsx` file named after the **component**, not the folder.
- The `index.ts` / `index.js` barrel file is **appended to** (not overwritten) when a new component is added to an existing module.
- Before writing, check if the component file already exists using `fs-extra.pathExists()` and warn the user rather than silently overwriting.

### Barrel File Strategy

On each `create` run, the generator:
1. Reads the existing `index` file (if present).
2. Checks if an export for the new component already exists.
3. Appends the new export line if it does not.

This keeps all barrel file updates additive and non-destructive.

---

## File Templates

### Component Template (`templates.js`)

```js
// tsx variant
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

### Barrel File — New (`templates.js`)

```js
export const barrelTemplate = (name) =>
  `export { default as ${name} } from './${name}';\n`;
```

### Barrel File — Append line

```js
export const barrelExportLine = (name) =>
  `export { default as ${name} } from './${name}';\n`;
```

---

## Core Generator Logic (`generator.js`)

```
createComponent(moduleName, componentName, lang):
  1. Resolve target directory → `<cwd>/<moduleName>/`
  2. fs-extra.ensureDir(targetDir)                  // creates folder if not exists
  3. Build component file path → `<targetDir>/<componentName>.<lang>`
  4. Check pathExists → warn and abort if duplicate
  5. Write component file using componentTemplate()
  6. Build index file path → `<targetDir>/index.<indexExt>`
     - indexExt = lang === 'tsx' ? 'ts' : 'js'
  7. If index does not exist → write fresh barrel file
     Else → read existing, check for duplicate export, append if missing
  8. Log success with chalk
```

---

## Key Behaviours & Edge Cases

| Scenario | Behaviour |
|---|---|
| Folder already exists | `ensureDir` is a no-op — proceeds safely |
| Component file already exists | Warn user, exit without overwriting |
| Export already in index | Skip append, notify user |
| Module name === Component name | Valid — standard single-component module |
| Module name !== Component name | Valid — multi-component module, folder name stays as module |
| Mixed `tsx`/`jsx` in same module | Discouraged — warn user if extension mismatch detected in existing folder |

---

## package.json (key fields)

```json
{
  "name": "react-gen",
  "version": "1.0.0",
  "bin": {
    "mknrc": "./bin/index.js"
  },
  "type": "module",
}
```

---

## Implementation Notes for the Agent

- Use **ES Modules** (`"type": "module"`) to stay current; all imports use `import`/`export`.
- `chalk` v5+ and `inquirer` v9+ are ESM-only — do not use `require()`.
- Keep `bin/index.js` thin: parse args with `commander`, delegate to `src/commands/create.js`.
- Keep templates in `src/lib/templates.js` as pure functions — easy to extend later (e.g. adding Storybook or test file generation).
- All file I/O goes through `fs-extra`, never raw `fs`, for safety and convenience.
- Output clear, coloured feedback for every action: created / skipped / appended.