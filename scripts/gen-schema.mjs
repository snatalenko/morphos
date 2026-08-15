// Build step: inline schemas/mapping.json into the compiled schema.placeholder
// modules in dist/, replacing the JSON-module import that tsc emits.
//
// schemas/mapping.json stays the single source of truth. src/schema.placeholder.ts
// re-exports it (resolved natively by ts-jest/Vite during dev). For the published
// package we don't want a JSON-module import — it requires import attributes in
// native ESM and behaves inconsistently across CJS/ESM — so here we overwrite the
// emitted dist files with a plain object literal and a clean type declaration.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas', 'mapping.json'), 'utf8'));
const literal = JSON.stringify(schema, null, '\t');

const banner = '// AUTO-GENERATED FROM schemas/mapping.json\n';

const targets = [
	{
		dir: join(root, 'dist', 'esm'),
		file: 'mappingSchema.js',
		content: `${banner}export const mappingSchema = ${literal};\nexport default mappingSchema;\n`
	},
	{
		dir: join(root, 'dist', 'cjs'),
		file: 'mappingSchema.js',
		content: `${banner}'use strict';\n`
			+ 'Object.defineProperty(exports, "__esModule", { value: true });\n'
			+ `const mappingSchema = ${literal};\n`
			+ 'exports.mappingSchema = mappingSchema;\n'
			+ 'exports.default = mappingSchema;\n'
	},
	{
		dir: join(root, 'dist', 'types'),
		file: 'mappingSchema.d.ts',
		content: `${banner}import type { JsonSchema } from './JsonSchema.js';\n`
			+ 'export declare const mappingSchema: JsonSchema;\n'
			+ 'declare const _default: JsonSchema;\n'
			+ 'export default _default;\n'
	}
];

for (const { dir, file, content } of targets) {
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, file), content);
}
