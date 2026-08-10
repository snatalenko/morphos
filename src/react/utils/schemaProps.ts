import type { JsonSchema } from '../types.ts';

export function schemaType(schema: JsonSchema | undefined): string | undefined {
	if (!schema || schema.type === undefined)
		return undefined;
	if (Array.isArray(schema.type))
		return schema.type[0];

	return schema.type;
}

export function getPropertySchema(parent: JsonSchema | undefined, name: string): JsonSchema | undefined {
	if (!parent)
		return undefined;

	const sub = parent.properties?.[name];
	if (sub !== undefined && typeof sub !== 'boolean')
		return sub;

	for (const alternatives of [parent.allOf, parent.oneOf, parent.anyOf]) {
		for (const alternative of alternatives ?? []) {
			if (typeof alternative === 'boolean')
				continue;

			const alternativeProperty = getPropertySchema(alternative, name);
			if (alternativeProperty)
				return alternativeProperty;
		}
	}

	return undefined;
}

export function getItemsSchema(parent: JsonSchema | undefined): JsonSchema | undefined {
	if (!parent || parent.items === undefined)
		return undefined;
	if (Array.isArray(parent.items) || typeof parent.items === 'boolean')
		return undefined;

	return parent.items;
}

export function getTupleItemSchema(parent: JsonSchema | undefined, index: number): JsonSchema | undefined {
	if (!parent)
		return undefined;

	if (!Array.isArray(parent.items))
		return getItemsSchema(parent);

	const item = parent.items[index];
	return item === undefined || typeof item === 'boolean' ? undefined : item;
}
