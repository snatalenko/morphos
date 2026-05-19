import type { JsonSchema, SourceFieldMatch } from '../types.ts';
import { findSourceFields } from './sourceFields.ts';

export function typesCompatible(destType: string | undefined, sourceType: string | undefined): boolean {
	if (!destType)
		return true;
	if (!sourceType)
		return false;
	if (destType === sourceType)
		return true;
	if ((destType === 'number' || destType === 'integer') &&
		(sourceType === 'number' || sourceType === 'integer'))
		return true;

	return false;
}

export function preferNameMatches(
	fields: SourceFieldMatch[],
	sourceSchema: JsonSchema | undefined,
	name: string,
	type?: string
): SourceFieldMatch[] {
	if (!sourceSchema || !name || fields.length < 2)
		return fields;

	const matchedPaths = new Set(
		Array.from(findSourceFields(sourceSchema, { name, type }), s => s.path)
	);
	if (matchedPaths.size === 0 || matchedPaths.size === fields.length)
		return fields;

	return [
		...fields.filter(s => matchedPaths.has(s.path)),
		...fields.filter(s => !matchedPaths.has(s.path))
	];
}

export function arrayContextSuggestions(
	recordSchema: JsonSchema | undefined,
	collectionSchema: JsonSchema | undefined
): SourceFieldMatch[] {
	return [
		{
			path: '$index',
			schema: {
				type: 'integer',
				description: 'Current array item index'
			}
		},
		{
			path: '$record',
			schema: recordSchema ?? {
				description: 'Current array item value'
			}
		},
		{
			path: '$collection',
			schema: collectionSchema ?? {
				type: 'array',
				description: 'Current array collection'
			}
		}
	];
}

export function mergeSourceSuggestions(
	fields: SourceFieldMatch[],
	extraFields: SourceFieldMatch[]
): SourceFieldMatch[] {
	if (extraFields.length === 0)
		return fields;

	const seen = new Set(fields.map(f => f.path));
	return [
		...fields,
		...extraFields.filter(f => !seen.has(f.path))
	];
}
