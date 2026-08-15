import type { AddKind, JsonSchema } from '../types.ts';
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
