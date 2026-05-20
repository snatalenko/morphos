import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { listDestinationSchemaFieldEntries } from './listDestinationSchemaFieldEntries.ts';

export function isDestinationSchemaFullyMapped(destinationSchema: JsonSchema, mapping: RootMapping): boolean {
	for (const entry of listDestinationSchemaFieldEntries(destinationSchema, mapping)) {
		if (!entry.mapped)
			return false;
	}

	return true;
}
