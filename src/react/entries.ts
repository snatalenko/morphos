import type {
	RootMapping,
	ValueMap,
	PropertiesMap,
	ArrayMapping,
	ObjectInContextMapping,
	ObjectMapping
} from '../mappingTypes.ts';
import type { MappingSchema, SourceFieldMatch } from './types.ts';

export type ExprEntryValue = { kind: 'expr'; expr: string };
export type ArrayEntryValue = { kind: 'array'; forEach: string; entries: Entry[] };
export type ObjectEntryValue = { kind: 'object'; from: string; entries: Entry[] };
export type EntryValue = ExprEntryValue | ArrayEntryValue | ObjectEntryValue;

export type Entry = {
	id: string;
	key: string;
	value: EntryValue;
};

let idCounter = 0;
export const genId = () => `dm-${++idCounter}`;

export function getPropertySchema(parent: MappingSchema | undefined, name: string): MappingSchema | undefined {
	if (!parent || !parent.properties)
		return undefined;

	const sub = parent.properties[name];
	if (sub === undefined || typeof sub === 'boolean')
		return undefined;

	return sub;
}

export function getItemsSchema(parent: MappingSchema | undefined): MappingSchema | undefined {
	if (!parent || parent.items === undefined)
		return undefined;
	if (Array.isArray(parent.items) || typeof parent.items === 'boolean')
		return undefined;

	return parent.items;
}

export function schemaType(schema: MappingSchema | undefined): string | undefined {
	if (!schema || schema.type === undefined)
		return undefined;
	if (Array.isArray(schema.type))
		return schema.type[0];

	return schema.type;
}

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

export function findSourceFields(
	sourceSchema: MappingSchema | undefined,
	filter: { name?: string; type?: string }
): SourceFieldMatch[] {
	if (!sourceSchema)
		return [];

	const matches: SourceFieldMatch[] = [];
	const target = filter.name === undefined ? undefined : normalizeName(filter.name);

	const walk = (node: MappingSchema, path: string, leafName: string | undefined) => {
		const t = schemaType(node);
		if (path !== '' && leafName !== undefined) {
			const nameOk = target === undefined || normalizeName(leafName) === target;
			const typeOk = filter.type === undefined || t === filter.type;
			if (nameOk && typeOk)
				matches.push({ path, schema: node });
		}

		if (t === 'object' && node.properties) {
			for (const [propName, propSchema] of Object.entries(node.properties)) {
				if (propSchema === undefined || typeof propSchema === 'boolean')
					continue;

				walk(propSchema, joinPath(path, propName), propName);
			}
		}
	};

	walk(sourceSchema, '', undefined);

	return matches;
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

export function createEntryValueForSchema(schema: MappingSchema): EntryValue {
	const t = schemaType(schema);
	if (t === 'object')
		return { kind: 'object', from: '', entries: [] };
	if (t === 'array')
		return { kind: 'array', forEach: '', entries: [] };

	return { kind: 'expr', expr: '' };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function assertNever(value: never): never {
	throw new Error(`Unexpected mapping entry value: ${JSON.stringify(value)}`);
}

function propsToEntries(map: PropertiesMap | undefined): Entry[] {
	if (!map || Array.isArray(map))
		return [];

	return Object.entries(map).map(([key, value]) => ({
		id: genId(),
		key,
		value: valueToEntryValue(value as ValueMap)
	}));
}

function valueToEntryValue(v: ValueMap): EntryValue {
	if (typeof v === 'string')
		return { kind: 'expr', expr: v };

	if (isPlainObject(v)) {
		if ('forEach' in v && 'map' in v) {
			const am = v as ArrayMapping;
			return { kind: 'array', forEach: am.forEach, entries: propsToEntries(am.map) };
		}
		if ('from' in v && 'map' in v) {
			const cm = v as ObjectInContextMapping;
			return { kind: 'object', from: cm.from, entries: propsToEntries(cm.map) };
		}
		if ('map' in v && Object.keys(v).length === 1) {
			const om = v as ObjectMapping;
			return { kind: 'object', from: '', entries: propsToEntries(om.map) };
		}
		return { kind: 'object', from: '', entries: propsToEntries(v as PropertiesMap) };
	}

	return { kind: 'expr', expr: '' };
}

export function rootToEntries(root: RootMapping | undefined): Entry[] {
	if (root == null || typeof root === 'string' || Array.isArray(root))
		return [];

	if ('forEach' in root && 'map' in root)
		return propsToEntries((root as ArrayMapping).map);

	if ('from' in root && 'map' in root)
		return propsToEntries((root as ObjectInContextMapping).map);

	if ('map' in root && Object.keys(root).length === 1)
		return propsToEntries((root as ObjectMapping).map);

	return propsToEntries(root as PropertiesMap);
}

export function entriesToProps(entries: Entry[]): PropertiesMap {
	const out: Record<string, ValueMap> = {};
	for (const e of entries) {
		if (e.key === '')
			continue;

		out[e.key] = entryValueToValue(e.value);
	}

	return out;
}

export function convertEntryValue(prev: EntryValue, to: 'expr' | 'array' | 'object'): EntryValue {
	if (to === 'expr') {
		if (prev.kind === 'expr')
			return prev;
		if (prev.kind === 'array')
			return { kind: 'expr', expr: prev.forEach };

		return { kind: 'expr', expr: prev.from };
	}

	if (to === 'array') {
		if (prev.kind === 'array')
			return prev;
		if (prev.kind === 'object')
			return { kind: 'array', forEach: prev.from, entries: prev.entries };

		return { kind: 'array', forEach: prev.expr, entries: [] };
	}

	if (prev.kind === 'object')
		return prev;
	if (prev.kind === 'array')
		return { kind: 'object', from: prev.forEach, entries: prev.entries };

	return { kind: 'object', from: prev.expr, entries: [] };
}

function entryValueToValue(ev: EntryValue): ValueMap {
	if (ev.kind === 'expr')
		return ev.expr;

	if (ev.kind === 'array')
		return { forEach: ev.forEach, map: entriesToProps(ev.entries) };

	if (ev.kind === 'object') {
		if (ev.from === '')
			return entriesToProps(ev.entries);

		return { from: ev.from, map: entriesToProps(ev.entries) };
	}

	return assertNever(ev);
}
