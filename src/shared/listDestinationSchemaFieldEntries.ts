import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { isJsonSchema, schemaItems, schemaTupleItems, schemaType } from './jsonSchemaUtils.ts';
import { mappedFieldPaths } from './mappingFieldPaths.ts';

export type DestinationSchemaFieldEntry = {
	path: string;
	schema: JsonSchema | boolean;
	mapped: boolean;
	required: boolean;
}

type SchemaFieldEntry = Omit<DestinationSchemaFieldEntry, 'mapped'>;

function pathJoin(prefix: string, fieldName: string): string {
	return prefix ? `${prefix}.${fieldName}` : fieldName;
}

function* collectSchemaFieldEntries(
	schema: JsonSchema,
	prefix: string,
	required: boolean
): Generator<SchemaFieldEntry> {
	const type = schemaType(schema);
	if (type === 'object' || schema.properties) {
		const properties = Object.entries(schema.properties ?? {});
		if (properties.length === 0 && prefix)
			yield { path: prefix, schema, required };

		for (const [fieldName, propertySchema] of properties) {
			const path = pathJoin(prefix, fieldName);
			const propertyRequired = required && (schema.required ?? []).includes(fieldName);
			if (isJsonSchema(propertySchema))
				yield* collectSchemaFieldEntries(propertySchema, path, propertyRequired);
			else
				yield { path, schema: propertySchema, required: propertyRequired };
		}
		return;
	}

	if (type === 'array') {
		const tupleItems = schemaTupleItems(schema);
		if (tupleItems) {
			for (const [index, item] of tupleItems.entries()) {
				const path = pathJoin(prefix, String(index));
				if (isJsonSchema(item))
					yield* collectSchemaFieldEntries(item, path, required);
				else
					yield { path, schema: item, required };
			}
			return;
		}

		const itemSchema = schemaItems(schema);
		if (itemSchema) {
			yield* collectSchemaFieldEntries(itemSchema, prefix, required);
			return;
		}
	}

	if (prefix)
		yield { path: prefix, schema, required };
}

export function* listDestinationSchemaFieldEntries(
	destinationSchema: JsonSchema,
	mapping: RootMapping
): Generator<DestinationSchemaFieldEntry> {
	const mappingPaths = mappedFieldPaths(mapping);
	for (const entry of collectSchemaFieldEntries(destinationSchema, '', true)) {
		yield {
			path: entry.path,
			schema: entry.schema,
			mapped: mappingPaths.has(entry.path),
			required: entry.required
		};
	}
}
