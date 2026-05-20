import type { JsonSchema } from '../JsonSchema.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonSchema(value: JsonSchema | boolean | undefined): value is JsonSchema {
	return isRecord(value);
}

export function schemaType(schema: JsonSchema | undefined): string | undefined {
	if (!schema || schema.type === undefined)
		return undefined;
	if (!Array.isArray(schema.type))
		return schema.type;

	return schema.type.find(type => type !== 'null') ?? schema.type[0];
}

export function schemaPropertyEntries(
	properties: NonNullable<JsonSchema['properties']>
): Array<[string, JsonSchema]> {
	return Object.entries(properties).filter((entry): entry is [string, JsonSchema] => isJsonSchema(entry[1]));
}

export function schemaItems(schema: JsonSchema): JsonSchema | undefined {
	if (Array.isArray(schema.items))
		return undefined;

	return isJsonSchema(schema.items) ? schema.items : undefined;
}

export function schemaTupleItems(schema: JsonSchema): Array<JsonSchema | boolean> | undefined {
	return Array.isArray(schema.items) ? schema.items : undefined;
}
