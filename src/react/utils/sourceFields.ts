import type { MappingSchema, SourceFieldMatch } from '../types.ts';
import { schemaType } from './schemaProps.ts';

function normalizeName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
function joinPath(parent: string, name: string): string {
	const safe = IDENT_RE.test(name);
	if (parent === '')
		return safe ? name : `["${name.replace(/"/g, '\\"')}"]`;

	return safe ? `${parent}.${name}` : `${parent}["${name.replace(/"/g, '\\"')}"]`;
}

function* walkSchema(
	node: MappingSchema,
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
}

export function* findSourceFields(
	sourceSchema: MappingSchema | undefined,
	filter: { name?: string; type?: string }
): Generator<SourceFieldMatch> {
	if (!sourceSchema)
		return;

	const target = filter.name === undefined ? undefined : normalizeName(filter.name);
	yield* walkSchema(sourceSchema, '', undefined, target, filter.type);
}

export function extendSourceSchema(
	inner: MappingSchema | undefined,
	outer: MappingSchema | undefined,
	consumedPath?: string
): MappingSchema | undefined {
	if (!inner)
		return outer;
	if (!outer || !outer.properties || schemaType(outer) !== 'object')
		return inner;
	if (!inner.properties || schemaType(inner) !== 'object')
		return inner;

	const consumedKey = consumedPath ? consumedPath.split('.')[0] : undefined;
	const merged: { [name: string]: MappingSchema | boolean } = { ...inner.properties };
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
	sourceSchema: MappingSchema | undefined,
	path: string
): MappingSchema | undefined {
	if (!sourceSchema || !path)
		return undefined;
	if (!/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(path))
		return undefined;

	const parts = path.split('.');
	let current: MappingSchema | undefined = sourceSchema;
	for (const part of parts) {
		if (!current || !current.properties)
			return undefined;

		const sub = current.properties[part];
		if (sub === undefined || typeof sub === 'boolean')
			return undefined;

		current = sub;
	}

	return current;
}
