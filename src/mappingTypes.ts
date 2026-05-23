export type ValueMap =
	string |
	ObjectMapping |
	ArrayMapping |
	ObjectInContextMapping |
	ConditionalMapping |
	ConcatMapping |
	PropertiesMap;

export type PropertiesMap = {
	[fieldName: string]: ValueMap
} | Array<ValueMap>;

export type ObjectPropertiesMap = Exclude<PropertiesMap, Array<ValueMap>>;

export type ObjectMapping = {
	map: PropertiesMap
}

export type ArrayMapping = {
	forEach: string,
	map: PropertiesMap
}

export type ObjectInContextMapping = {
	from: string,
	map: PropertiesMap
}

export type ConditionalMapping = {
	when: string,
	then: ValueMap,
	else?: ValueMap
}

export type ConcatMapping = {
	concat: Array<ValueMap>
}

export type RootMapping =
	ObjectMapping |
	ArrayMapping |
	ObjectInContextMapping |
	ConditionalMapping |
	ConcatMapping |
	PropertiesMap;

export type RootElementMapping = {
	'*': ValueMap
}

export type WildcardSpreadMap = {
	'*': '*'
} & ObjectPropertiesMap;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
	const actual = Object.keys(value);
	return actual.length === keys.length && keys.every(key => actual.includes(key));
}

export function isConditionalMapping(mapping: unknown): mapping is ConditionalMapping {
	return isRecord(mapping)
		&& 'when' in mapping
		&& Object.keys(mapping).every(key => key === 'when' || key === 'then' || key === 'else');
}

export function isArrayMapping(mapping: unknown): mapping is ArrayMapping {
	return isRecord(mapping) && hasOnlyKeys(mapping, ['forEach', 'map']);
}

export function isConcatMapping(mapping: unknown): mapping is ConcatMapping {
	return isRecord(mapping) && hasOnlyKeys(mapping, ['concat']);
}

export function isObjectInContextMapping(mapping: unknown): mapping is ObjectInContextMapping {
	return isRecord(mapping) && hasOnlyKeys(mapping, ['from', 'map']);
}

export function isObjectMapping(mapping: unknown): mapping is ObjectMapping {
	return isRecord(mapping) && hasOnlyKeys(mapping, ['map']);
}

export function isRootElementMapping(mapping: unknown): mapping is RootElementMapping {
	return isRecord(mapping) && hasOnlyKeys(mapping, ['*']);
}

export function isTupleArrayMapping(mapping: unknown): boolean {
	if (Array.isArray(mapping))
		return mapping.length > 0;

	if (!isRecord(mapping))
		return false;

	const keys = Object.keys(mapping);
	return keys.length > 0 && keys.every(k => k && !isNaN(Number(k)));
}

export function isWildcardSpread(map: PropertiesMap): map is WildcardSpreadMap {
	return !Array.isArray(map) && map['*'] === '*';
}
