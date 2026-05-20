import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { listDestinationSchemaFieldEntries } from './listDestinationSchemaFieldEntries.ts';

export function isSchemaFullyMapped(
	destinationSchema: JsonSchema,
	mapping: RootMapping,
	requiredOnly?: boolean
): boolean {
	for (const entry of listDestinationSchemaFieldEntries(destinationSchema, mapping)) {
		if (requiredOnly && !entry.required)
			continue;
		if (!entry.mapped)
			return false;
	}

	return true;
}
