import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { isJsonSchema, schemaItems, schemaTupleItems, schemaType } from './jsonSchemaUtils.ts';
import { mappedFieldPaths } from './mappingFieldPaths.ts';

function pathJoin(prefix: string, fieldName: string): string {
	return prefix ? `${prefix}.${fieldName}` : fieldName;
}

function collectSchemaPaths(schema: JsonSchema, prefix: string, result: Set<string>): void {
	const type = schemaType(schema);
	if (type === 'object' || schema.properties) {
		for (const [fieldName, propertySchema] of Object.entries(schema.properties ?? {})) {
			const path = pathJoin(prefix, fieldName);
			result.add(path);
			if (isJsonSchema(propertySchema))
				collectSchemaPaths(propertySchema, path, result);
		}
		return;
	}

	if (type === 'array') {
		const tupleItems = schemaTupleItems(schema);
		if (tupleItems) {
			tupleItems.forEach((item, index) => {
				const path = pathJoin(prefix, String(index));
				result.add(path);
				if (isJsonSchema(item))
					collectSchemaPaths(item, path, result);
			});
			return;
		}

		const itemSchema = schemaItems(schema);
		if (itemSchema)
			collectSchemaPaths(itemSchema, prefix, result);
	}
}

export function isDestinationSchemaFullyMapped(destinationSchema: JsonSchema, mapping: RootMapping): boolean {
	const schemaPaths = new Set<string>();
	collectSchemaPaths(destinationSchema, '', schemaPaths);

	const mappingPaths = mappedFieldPaths(mapping);
	for (const path of schemaPaths) {
		if (!mappingPaths.has(path))
			return false;
	}

	return true;
}
