import {
	isConditionalMapping,
	isConcatMapping,
	isTupleArrayMapping,
	type RootMapping,
	type ValueMap,
	type PropertiesMap,
	type ArrayMapping,
	type ObjectInContextMapping,
	type ObjectMapping,
	type ConditionalMapping,
	type ConcatMapping
} from '../../mappingTypes.ts';
import type { AddKind, JsonSchema } from '../types.ts';
export type {
	ExprEntryValue,
	ArrayEntryValue,
	ObjectEntryValue,
	ConditionalEntryValue,
	ConcatEntryValue,
	TupleEntryValue,
	EntryValue,
	Entry
} from './entryTypes.ts';
import type {
	EntryValue,
	Entry
} from './entryTypes.ts';
import {
	getItemsSchema,
	schemaType
} from './schemaProps.ts';
import {
	createRequiredEntriesForObjectSchema,
	createRequiredEntryValueForSchema
} from './createEntryValueForSchema.ts';
import { genId } from './ids.ts';

export { genId };
export const WILDCARD_KEY = '*';

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

function rootValueToEntries(value: ValueMap): Entry[] {
	return [{
		id: genId(),
		key: WILDCARD_KEY,
		value: valueToEntryValue(value),
		rootValue: true
	}];
}

function mergeRequiredEntries(entries: Entry[], schema: JsonSchema): Entry[] {
	const existing = new Set(entries.map(entry => entry.key));
	const required = createRequiredEntriesForObjectSchema(schema).filter(entry => !existing.has(entry.key));
	return required.length === 0 ? entries : [...entries, ...required];
}

function arrayItemObjectSchema(schema: JsonSchema | undefined): JsonSchema | undefined {
	if (schemaType(schema) !== 'array')
		return undefined;

	const itemSchema = schema ? getItemsSchema(schema) : undefined;
	return itemSchema && (schemaType(itemSchema) === 'object' || itemSchema.properties) ? itemSchema : undefined;
}

function ensureArrayObjectEntryValue(value: EntryValue, itemSchema: JsonSchema): EntryValue {
	if (value.kind === 'array')
		return { ...value, entries: mergeRequiredEntries(value.entries, itemSchema) };
	if (value.kind === 'object')
		return { ...value, entries: mergeRequiredEntries(value.entries, itemSchema) };
	if (value.kind === 'conditional') {
		return {
			...value,
			then: ensureArrayObjectEntryValue(value.then, itemSchema),
			else: value.else === undefined ? undefined : ensureArrayObjectEntryValue(value.else, itemSchema)
		};
	}
	if (value.kind === 'concat' || value.kind === 'tuple') {
		if (value.items.length === 0)
			return { ...value, items: [createRequiredEntryValueForSchema(itemSchema)] };

		return { ...value, items: value.items.map(item => ensureArrayObjectEntryValue(item, itemSchema)) };
	}

	return createRequiredEntryValueForSchema(itemSchema);
}

function valueToEntryValue(v: ValueMap): EntryValue {
	if (typeof v === 'string')
		return { kind: 'expr', expr: v };

	if (Array.isArray(v))
		return { kind: 'tuple', items: v.map(item => valueToEntryValue(item)) };

	if (isPlainObject(v)) {
		if ('when' in v && 'then' in v) {
			const cm = v as ConditionalMapping;
			return {
				kind: 'conditional',
				when: cm.when,
				then: valueToEntryValue(cm.then),
				else: cm.else === undefined ? undefined : valueToEntryValue(cm.else)
			};
		}
		if ('concat' in v && Object.keys(v).length === 1) {
			const cm = v as ConcatMapping;
			return { kind: 'concat', items: cm.concat.map(item => valueToEntryValue(item)) };
		}
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
		if (isTupleArrayMapping(v)) {
			const entries = Object.entries(v);
			const maxIndex = Math.max(...entries.map(([key]) => Number(key)));
			const items = Array.from({ length: maxIndex + 1 }, (_, index) => {
				const item = v[String(index)] as ValueMap | undefined;
				return item === undefined ? { kind: 'expr' as const, expr: '' } : valueToEntryValue(item);
			});
			return { kind: 'tuple', items };
		}
		return { kind: 'object', from: '', entries: propsToEntries(v as PropertiesMap) };
	}

	return { kind: 'expr', expr: '' };
}

export function rootToEntries(root: RootMapping | undefined): Entry[] {
	if (root == null || typeof root === 'string' || Array.isArray(root))
		return [];

	if (isConditionalMapping(root) || isConcatMapping(root))
		return rootValueToEntries(root);

	if ('forEach' in root && 'map' in root)
		return propsToEntries((root as ArrayMapping).map);

	if ('from' in root && 'map' in root)
		return propsToEntries((root as ObjectInContextMapping).map);

	if ('map' in root && Object.keys(root).length === 1)
		return propsToEntries((root as ObjectMapping).map);

	return propsToEntries(root as PropertiesMap);
}

export function entriesToRootMapping(entries: Entry[]): RootMapping {
	const mappedEntries = entries.filter(e => e.key !== '');
	if (mappedEntries.length === 1 && mappedEntries[0].rootValue === true)
		return entryValueToValue(mappedEntries[0].value) as RootMapping;

	return entriesToProps(entries);
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

export function convertEntryValue(prev: EntryValue, to: AddKind): EntryValue {
	if (to === 'expr') {
		if (prev.kind === 'expr')
			return prev;
		if (prev.kind === 'concat' || prev.kind === 'tuple')
			return prev.items[0] ? convertEntryValue(prev.items[0], to) : { kind: 'expr', expr: '' };
		if (prev.kind === 'array')
			return { kind: 'expr', expr: prev.forEach };
		if (prev.kind === 'conditional') {
			if (prev.then.kind === 'expr')
				return prev.then;

			return { kind: 'expr', expr: prev.when };
		}

		return { kind: 'expr', expr: prev.from };
	}

	if (to === 'array') {
		if (prev.kind === 'array')
			return prev;
		if (prev.kind === 'concat' || prev.kind === 'tuple')
			return prev.items[0] ? convertEntryValue(prev.items[0], to) : { kind: 'array', forEach: '', entries: [] };
		if (prev.kind === 'object')
			return { kind: 'array', forEach: prev.from, entries: prev.entries };
		if (prev.kind === 'conditional') {
			if (prev.then.kind === 'array')
				return prev.then;

			return { kind: 'array', forEach: prev.when, entries: [] };
		}

		return { kind: 'array', forEach: prev.expr, entries: [] };
	}

	if (to === 'conditional') {
		if (prev.kind === 'conditional')
			return prev;

		return { kind: 'conditional', when: '', then: prev };
	}

	if (to === 'concat') {
		if (prev.kind === 'concat')
			return prev;
		if (prev.kind === 'tuple')
			return { kind: 'concat', items: prev.items };

		return { kind: 'concat', items: [prev] };
	}

	if (to === 'tuple') {
		if (prev.kind === 'tuple')
			return prev;
		if (prev.kind === 'concat')
			return { kind: 'tuple', items: prev.items };

		return { kind: 'tuple', items: [prev] };
	}

	if (prev.kind === 'object')
		return prev;
	if (prev.kind === 'concat' || prev.kind === 'tuple')
		return prev.items[0] ? convertEntryValue(prev.items[0], to) : { kind: 'object', from: '', entries: [] };
	if (prev.kind === 'array')
		return { kind: 'object', from: prev.forEach, entries: prev.entries };
	if (prev.kind === 'conditional') {
		if (prev.then.kind === 'object')
			return prev.then;

		return { kind: 'object', from: prev.when, entries: [] };
	}

	return { kind: 'object', from: prev.expr, entries: [] };
}

export function convertEntryValueForSchema(prev: EntryValue, to: AddKind, schema: JsonSchema | undefined): EntryValue {
	const next = convertEntryValue(prev, to);
	const itemSchema = arrayItemObjectSchema(schema);
	if (!itemSchema || (to !== 'array' && to !== 'concat' && to !== 'tuple'))
		return next;

	return ensureArrayObjectEntryValue(next, itemSchema);
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

	if (ev.kind === 'conditional') {
		const result: ConditionalMapping = {
			when: ev.when,
			then: entryValueToValue(ev.then)
		};
		if (ev.else !== undefined)
			result.else = entryValueToValue(ev.else);

		return result;
	}

	if (ev.kind === 'concat')
		return { concat: ev.items.map(item => entryValueToValue(item)) };

	if (ev.kind === 'tuple') {
		const result: Record<string, ValueMap> = {};
		ev.items.forEach((item, index) => {
			result[index] = entryValueToValue(item);
		});
		return result;
	}

	return assertNever(ev);
}
