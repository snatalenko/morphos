# Contributing

Thanks for taking the time to contribute!

## Development setup

Prerequisites:

- Node.js 16+
- npm

Clone and install:

```bash
git clone git@github.com:snatalenko/morphos.git
cd morphos
npm ci
```

## Project structure

- `src/` - mapper runtime and public APIs
- `tests/unit/` - Jest tests
- `tests/unit/data/` - test fixtures
- `schemas/` - JSON schemas
- `scripts/changelog/` - changelog templates/config
- `dist/` and `types/` - generated build output

## Common tasks

```bash
npm run cleanup        # Remove dist/, types/, coverage/
npm test
npm run test:coverage  # Run tests with coverage report
npm run lint           # Run ESLint
npm run build          # Build both ESM and CJS outputs
npm run build:esm      # Build ESM only (generates dist/esm/ and types/)
npm run build:cjs      # Build CJS only (generates dist/cjs/)
```

### Running a single test file

```bash
npm test tests/unit/mappingSchema.test.ts
```

## Code style

Code style and formatting are enforced via [EditorConfig](https://editorconfig.org) ([.editorconfig](.editorconfig)) and [ESLint](https://eslint.org) ([eslint.config.mjs](eslint.config.mjs)).

- **Indentation:** Tabs (not spaces)
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Brace style:** Stroustrup
- **No `console.log`** in production code
- **No trailing commas**
- **Line length:** Warn at 120 chars
- **Type-only imports:** Use the `type` keyword for imports that are only used as types
- **`.ts` file extensions in imports:** Always use explicit `.ts` extensions in relative import paths

## Commits and pull requests

- Keep commits focused and include tests for behavior changes
- For PRs, include a short problem/solution summary and link the related issue (if any)
- Use one of the following prefixes for the commit messages:
  - `New:`, `Feat:` - New functionality
  - `Change:` - Change to existing behavior
  - `Fix:`, `Fixes:` - Bug-fix
  - `Perf:` - Performance improvement
  - `Security:` - Fix of a security issue
  - `Docs:` - Documentation
  - `Tests:` - Tests
  - `Build:`, `CI:` - Build scripts change
  - `Chore:`, `Internal Fix:` - Internal changes or fixes of not-yet-released functionality

## Licensing

By contributing, you agree that your contributions are licensed under the project license.
