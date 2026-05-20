import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { isJsonSchema, schemaItems, schemaTupleItems, schemaType } from './jsonSchemaUtils.ts';
import { mappedFieldPaths } from './mappingFieldPaths.ts';

export type DestinationSchemaFieldEntry = {
	path: string;
	schema: JsonSchema | boolean;
	mapped: boolean;
}

type SchemaFieldEntry = Omit<DestinationSchemaFieldEntry, 'mapped'>;

function pathJoin(prefix: string, fieldName: string): string {
	return prefix ? `${prefix}.${fieldName}` : fieldName;
}

function* collectSchemaFieldEntries(schema: JsonSchema, prefix: string): Generator<SchemaFieldEntry> {
	const type = schemaType(schema);
	if (type === 'object' || schema.properties) {
		const properties = Object.entries(schema.properties ?? {});
		if (properties.length === 0 && prefix)
			yield { path: prefix, schema };

		for (const [fieldName, propertySchema] of properties) {
			const path = pathJoin(prefix, fieldName);
			if (isJsonSchema(propertySchema))
				yield* collectSchemaFieldEntries(propertySchema, path);
			else
				yield { path, schema: propertySchema };
		}
		return;
	}

	if (type === 'array') {
		const tupleItems = schemaTupleItems(schema);
		if (tupleItems) {
			for (const [index, item] of tupleItems.entries()) {
				const path = pathJoin(prefix, String(index));
				if (isJsonSchema(item))
					yield* collectSchemaFieldEntries(item, path);
				else
					yield { path, schema: item };
			}
			return;
		}

		const itemSchema = schemaItems(schema);
		if (itemSchema) {
			yield* collectSchemaFieldEntries(itemSchema, prefix);
			return;
		}
	}

	if (prefix)
		yield { path: prefix, schema };
}

export function* listDestinationSchemaFieldEntries(
	destinationSchema: JsonSchema,
	mapping: RootMapping
): Generator<DestinationSchemaFieldEntry> {
	const mappingPaths = mappedFieldPaths(mapping);
	for (const entry of collectSchemaFieldEntries(destinationSchema, '')) {
		yield {
			...entry,
			mapped: mappingPaths.has(entry.path)
		};
	}
}
