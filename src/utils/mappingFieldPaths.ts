/* eslint-disable no-use-before-define */
import {
	isArrayMapping,
	isConcatMapping,
	isConditionalMapping,
	isObjectInContextMapping,
	isObjectMapping,
	isRootElementMapping,
	type PropertiesMap,
	type RootMapping,
	type ValueMap
} from '../mappingTypes.ts';

function pathJoin(prefix: string, fieldName: string): string {
	return prefix ? `${prefix}.${fieldName}` : fieldName;
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
