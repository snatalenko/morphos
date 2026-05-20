/* eslint-disable no-use-before-define */
import type {
	ArrayMapping,
	ConcatMapping,
	ConditionalMapping,
	ObjectInContextMapping,
	ObjectMapping,
	PropertiesMap,
	RootMapping,
	ValueMap
} from '../mappingTypes.ts';
import { isRecord } from './jsonSchemaUtils.ts';

function pathJoin(prefix: string, fieldName: string): string {
	return prefix ? `${prefix}.${fieldName}` : fieldName;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
	const actual = Object.keys(value);
	return actual.length === keys.length && keys.every(key => actual.includes(key));
}

function isConditionalMapping(value: ValueMap): value is ConditionalMapping {
	return isRecord(value)
		&& 'when' in value
		&& Object.keys(value).every(key => key === 'when' || key === 'then' || key === 'else');
}

function isConcatMapping(value: ValueMap): value is ConcatMapping {
	const record = value as Record<string, unknown>;
	return isRecord(value) && hasOnlyKeys(value, ['concat']) && Array.isArray(record.concat);
}

function isArrayMapping(value: ValueMap): value is ArrayMapping {
	const record = value as Record<string, unknown>;
	return isRecord(value) && hasOnlyKeys(value, ['forEach', 'map']) && isRecord(record.map);
}

function isObjectInContextMapping(value: ValueMap): value is ObjectInContextMapping {
	const record = value as Record<string, unknown>;
	return isRecord(value) && hasOnlyKeys(value, ['from', 'map']) && isRecord(record.map);
}

function isObjectMapping(value: ValueMap): value is ObjectMapping {
	const record = value as Record<string, unknown>;
	return isRecord(value) && hasOnlyKeys(value, ['map']) && isRecord(record.map);
}

function isRootElementMapping(value: ValueMap): value is { '*': ValueMap } {
	return isRecord(value) && hasOnlyKeys(value, ['*']);
}

function isNonEmptyExpression(value: string): boolean {
	return value.trim() !== '';
}

function* collectPropertiesMapPaths(map: PropertiesMap, prefix: string): Generator<string> {
	for (const [fieldName, value] of Object.entries(map)) {
		if (fieldName === '*') {
			yield* collectValueMapPaths(value, prefix);
			continue;
		}

		const path = pathJoin(prefix, fieldName);
		yield* collectValueMapPaths(value, path);
	}
}

function* collectValueMapPaths(value: ValueMap, prefix: string): Generator<string> {
	if (typeof value === 'string') {
		if (prefix && isNonEmptyExpression(value))
			yield prefix;

		return;
	}

	if (isConditionalMapping(value)) {
		if (!isNonEmptyExpression(value.when))
			return;

		yield* collectValueMapPaths(value.then, prefix);
		if (value.else !== undefined)
			yield* collectValueMapPaths(value.else, prefix);

		return;
	}

	if (isConcatMapping(value)) {
		for (const item of value.concat)
			yield* collectValueMapPaths(item, prefix);

		return;
	}

	if (isArrayMapping(value)) {
		if (!isNonEmptyExpression(value.forEach))
			return;

		yield* collectPropertiesMapPaths(value.map, prefix);
		return;
	}

	if (isObjectInContextMapping(value)) {
		if (!isNonEmptyExpression(value.from))
			return;

		yield* collectPropertiesMapPaths(value.map, prefix);
		return;
	}

	if (isObjectMapping(value)) {
		yield* collectPropertiesMapPaths(value.map, prefix);
		return;
	}

	if (isRootElementMapping(value)) {
		yield* collectValueMapPaths(value['*'], prefix);
		return;
	}

	yield* collectPropertiesMapPaths(value as PropertiesMap, prefix);
}

export function mappedFieldPaths(mapping: RootMapping): Set<string> {
	return new Set(collectValueMapPaths(mapping, ''));
}
