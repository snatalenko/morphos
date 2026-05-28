import type { RootMapping } from '../mappingTypes.ts';
import { mappedFieldPaths } from './mappingFieldPaths.ts';

export function countMappedFields(mapping: RootMapping): number {
	return mappedFieldPaths(mapping).size;
}
