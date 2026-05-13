import type { MappingSchema } from '../types.ts';

export function schemaType(schema: MappingSchema | undefined): string | undefined {
	if (!schema || schema.type === undefined)
		return undefined;
	if (Array.isArray(schema.type))
		return schema.type[0];

	return schema.type;
}

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
