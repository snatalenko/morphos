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

function collectPropertiesMapPaths(map: PropertiesMap, prefix: string, result: Set<string>): void {
	for (const [fieldName, value] of Object.entries(map)) {
		if (fieldName === '*') {
			collectValueMapPaths(value, prefix, result);
			continue;
		}

		const path = pathJoin(prefix, fieldName);
		result.add(path);
		collectValueMapPaths(value, path, result);
	}
}

function collectValueMapPaths(value: ValueMap, prefix: string, result: Set<string>): void {
	if (typeof value === 'string')
		return;

	if (isConditionalMapping(value)) {
		collectValueMapPaths(value.then, prefix, result);
		if (value.else !== undefined)
			collectValueMapPaths(value.else, prefix, result);

		return;
	}

	if (isConcatMapping(value)) {
		value.concat.forEach(item => collectValueMapPaths(item, prefix, result));
		return;
	}

	if (isArrayMapping(value) || isObjectInContextMapping(value) || isObjectMapping(value)) {
		collectPropertiesMapPaths(value.map, prefix, result);
		return;
	}

	if (isRootElementMapping(value)) {
		collectValueMapPaths(value['*'], prefix, result);
		return;
	}

	collectPropertiesMapPaths(value as PropertiesMap, prefix, result);
}

export function mappedFieldPaths(mapping: RootMapping): Set<string> {
	const result = new Set<string>();
	collectValueMapPaths(mapping, '', result);
	return result;
}
