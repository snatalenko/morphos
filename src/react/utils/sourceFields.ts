import type { JsonSchema, SourceFieldMatch } from '../types.ts';
import { getPropertySchema, schemaType } from './schemaProps.ts';

function normalizeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const IDENT_START_RE = /[a-zA-Z_$]/;
const IDENT_CHAR_RE = /[a-zA-Z0-9_$]/;

function joinPath(parent: string, name: string): string {
	const safe = IDENT_RE.test(name);
	if (parent === '')
		return safe ? name : `["${name.replace(/"/g, '\\"')}"]`;

	return safe ? `${parent}.${name}` : `${parent}["${name.replace(/"/g, '\\"')}"]`;
}

function readIdentifier(path: string, start: number): [string, number] | undefined {
	if (!IDENT_START_RE.test(path[start]))
		return undefined;

	let index = start + 1;
	while (index < path.length && IDENT_CHAR_RE.test(path[index]))
		index += 1;

	return [path.slice(start, index), index];
}

function readQuotedProperty(path: string, start: number): [string, number] | undefined {
	if (path[start] !== '[')
		return undefined;

	const quote = path[start + 1];
	if (quote !== '"' && quote !== '\'')
		return undefined;

	let index = start + 2;
	let value = '';
	while (index < path.length) {
		const char = path[index];
		if (char === '\\') {
			if (index + 1 >= path.length)
				return undefined;

			value += path[index + 1];
			index += 2;
			continue;
		}

		if (char === quote) {
			if (path[index + 1] !== ']')
				return undefined;

			return [value, index + 2];
		}

		value += char;
		index += 1;
	}

	return undefined;
}

export function parseSourcePath(path: string): string[] | undefined {
	if (!path)
		return undefined;

	const parts: string[] = [];
	let index = 0;

	const first = readIdentifier(path, index) ?? readQuotedProperty(path, index);
	if (!first)
		return undefined;

	parts.push(first[0]);
	index = first[1];

	while (index < path.length) {
		if (path[index] === '.') {
			const next = readIdentifier(path, index + 1);
			if (!next)
				return undefined;

			parts.push(next[0]);
			index = next[1];
			continue;
		}

		const next = readQuotedProperty(path, index);
		if (!next)
			return undefined;

		parts.push(next[0]);
		index = next[1];
	}

	return parts;
}

export function sourcePathRoot(path: string | undefined): string | undefined {
	if (!path)
		return undefined;

	return parseSourcePath(path)?.[0];
}

function* walkSchema(
	node: JsonSchema,
	path: string,
	leafName: string | undefined,
	target: string | undefined,
	filterType: string | undefined
): Generator<SourceFieldMatch> {
	const t = schemaType(node);
	if (path !== '' && leafName !== undefined) {
		const nameOk = target === undefined || normalizeName(leafName) === target;
		const typeOk = filterType === undefined || t === filterType;
		if (nameOk && typeOk)
			yield { path, schema: node };
	}

	if (t === 'object' && node.properties) {
		for (const [propName, propSchema] of Object.entries(node.properties)) {
			if (propSchema === undefined || typeof propSchema === 'boolean')
				continue;

			yield* walkSchema(propSchema, joinPath(path, propName), propName, target, filterType);
		}
	}

	for (const alternatives of [node.allOf, node.oneOf, node.anyOf]) {
		for (const alternative of alternatives ?? []) {
			if (typeof alternative !== 'boolean')
				yield* walkSchema(alternative, path, leafName, target, filterType);
		}
	}
}

export function* findSourceFields(
	sourceSchema: JsonSchema | undefined,
	filter: { name?: string; type?: string }
): Generator<SourceFieldMatch> {
	if (!sourceSchema)
		return;

	const target = filter.name === undefined ? undefined : normalizeName(filter.name);
	const seen = new Set<string>();
	for (const field of walkSchema(sourceSchema, '', undefined, target, filter.type)) {
		// Bracket access requires an explicit base expression.
		if (field.path.startsWith('['))
			continue;

		if (!seen.has(field.path)) {
			seen.add(field.path);
			yield field;
		}
	}
}

export function extendSourceSchema(
	inner: JsonSchema | undefined,
	outer: JsonSchema | undefined,
	consumedPath?: string
): JsonSchema | undefined {
	if (!inner)
		return outer;
	if (!outer || !outer.properties || schemaType(outer) !== 'object')
		return inner;
	if (!inner.properties || schemaType(inner) !== 'object')
		return inner;

	const consumedKey = sourcePathRoot(consumedPath);
	const merged: { [name: string]: JsonSchema | boolean } = { ...inner.properties };
	for (const [k, v] of Object.entries(outer.properties)) {
		if (k in merged)
			continue;
		if (k === consumedKey)
			continue;

		merged[k] = v;
	}

	return { ...inner, properties: merged };
}

export function resolveSourcePath(
	sourceSchema: JsonSchema | undefined,
	path: string
): JsonSchema | undefined {
	if (!sourceSchema || !path)
		return undefined;

	const parts = parseSourcePath(path);
	if (!parts)
		return undefined;

	let current: JsonSchema | undefined = sourceSchema;
	for (const part of parts) {
		const sub = getPropertySchema(current, part);
		if (!sub)
			return undefined;

		current = sub;
	}

	return current;
}
