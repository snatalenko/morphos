import type { JsonSchema } from '../types.ts';
import type {
	Entry,
	EntryValue
} from './entryTypes.ts';
import {
	getItemsSchema,
	schemaType
} from './schemaProps.ts';
import { genId } from './ids.ts';

function isJsonSchema(v: JsonSchema | boolean | undefined): v is JsonSchema {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function createRequiredEntriesForObjectSchema(schema: JsonSchema): Entry[] {
	const properties = schema.properties ?? {};
	return (schema.required ?? []).map(key => {
		const propertySchema = properties[key];
		return {
			id: genId(),
			key,
			value: isJsonSchema(propertySchema) ? createRequiredEntryValueForSchema(propertySchema) : { kind: 'expr', expr: '' }
		};
	});
}

export function createRequiredEntryValueForSchema(schema: JsonSchema): EntryValue {
	const t = schemaType(schema);
	if (t === 'object' || schema.properties)
		return { kind: 'object', from: '', entries: createRequiredEntriesForObjectSchema(schema) };
	if (t === 'array') {
		if (Array.isArray(schema.items)) {
			return {
				kind: 'tuple',
				items: schema.items.map(item => (
					isJsonSchema(item)
						? createRequiredEntryValueForSchema(item)
						: { kind: 'expr', expr: '' }
				))
			};
		}

		const itemSchema = getItemsSchema(schema);
		return {
			kind: 'array',
			forEach: '',
			entries: itemSchema && (schemaType(itemSchema) === 'object' || itemSchema.properties)
				? createRequiredEntriesForObjectSchema(itemSchema)
				: []
		};
	}

	return { kind: 'expr', expr: '' };
}

export function createEntryValueForSchema(schema: JsonSchema): EntryValue {
	const t = schemaType(schema);
	if (t === 'object')
		return { kind: 'object', from: '', entries: [] };
	if (t === 'array')
		return createRequiredEntryValueForSchema(schema);

	return { kind: 'expr', expr: '' };
}
