import type { JsonSchema, SourceFieldMatch } from '../types.ts';
import { findSourceFields, sourcePathRoot } from './sourceFields.ts';

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
			scope: 'internal',
			schema: {
				type: 'integer',
				description: 'Current array item index'
			}
		},
		{
			path: '$record',
			scope: 'internal',
			schema: recordSchema ?? {
				description: 'Current array item value'
			}
		},
		{
			path: '$collection',
			scope: 'internal',
			schema: collectionSchema ?? {
				type: 'array',
				description: 'Current array collection'
			}
		}
	];
}

function isInternalSuggestion(field: SourceFieldMatch): boolean {
	return field.scope === 'internal' || field.path.startsWith('$');
}

function isConsumedPath(field: SourceFieldMatch, consumedPath: string | undefined): boolean {
	if (!consumedPath)
		return false;

	const consumedKey = sourcePathRoot(consumedPath);
	if (!consumedKey)
		return false;

	return field.path === consumedKey || field.path.startsWith(`${consumedKey}.`);
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

export function parentContextSuggestions(
	parentSchema: JsonSchema | undefined,
	inheritedSuggestions: SourceFieldMatch[],
	consumedPath?: string
): SourceFieldMatch[] {
	const parentFields = Array.from(findSourceFields(parentSchema, {}))
		.filter(field => !isConsumedPath(field, consumedPath))
		.map(field => ({ ...field, scope: 'parent' as const }));
	const inheritedParentFields = inheritedSuggestions
		.filter(field => !isInternalSuggestion(field))
		.map(field => ({ ...field, scope: 'parent' as const }));

	return mergeSourceSuggestions(parentFields, inheritedParentFields);
}
