/* eslint-disable no-use-before-define */
import type { PropertiesMap, RootMapping, ValueMap } from '../../mappingTypes.ts';
import type { JsonSchema } from '../../MappingSchema.ts';

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function schemaType(schema: JsonSchema | undefined): string | undefined {
	return Array.isArray(schema?.type)
		? schema.type.find(type => type !== 'null')
		: schema?.type;
}

function schemaObjectMap(schema: JsonSchema): PropertiesMap {
	const result: PropertiesMap = {};
	const properties = schema.properties ?? {};
	for (const requiredField of schema.required ?? []) {
		const propertySchema = properties[requiredField];
		if (isObject(propertySchema))
			result[requiredField] = requiredPlaceholderForSchema(propertySchema);
		else
			result[requiredField] = '';
	}

	return result;
}

function schemaArrayMap(schema: JsonSchema): PropertiesMap {
	const items = schema.items;
	if (isObject(items) && schemaType(items) === 'object')
		return schemaObjectMap(items);

	return { '*': isObject(items) ? requiredPlaceholderForSchema(items) : '' };
}

function schemaTupleMap(items: Array<JsonSchema | boolean>): PropertiesMap {
	const map: PropertiesMap = {};
	items.forEach((item, index) => {
		map[index] = isObject(item) ? requiredPlaceholderForSchema(item) : '';
	});
	return map;
}

function requiredPlaceholderForSchema(schema: JsonSchema): ValueMap {
	const type = schemaType(schema);
	if (type === 'object' || schema.properties) {
		return {
			map: schemaObjectMap(schema)
		};
	}
	if (type === 'array') {
		if (Array.isArray(schema.items))
			return schemaTupleMap(schema.items);

		return {
			forEach: '',
			map: schemaArrayMap(schema)
		};
	}
	return '';
}

function mappingMap(value: ValueMap): PropertiesMap | undefined {
	if (!isObject(value))
		return undefined;

	const objectValue = value as Record<string, unknown>;
	if (isObject(objectValue.map))
		return objectValue.map as PropertiesMap;
	if ('forEach' in value || 'from' in value || 'when' in value || 'concat' in value)
		return undefined;

	return value as PropertiesMap;
}

function completeValueMap(value: ValueMap, schema: JsonSchema): ValueMap {
	const type = schemaType(schema);
	if (type === 'object' || schema.properties) {
		if (!isObject(value))
			return requiredPlaceholderForSchema(schema);

		const map = mappingMap(value);
		if (map)
			completePropertiesMap(map, schema);

		return value;
	}
	if (type === 'array') {
		if (!isObject(value))
			return requiredPlaceholderForSchema(schema);

		if (Array.isArray(schema.items)) {
			const map = mappingMap(value);
			if (map)
				completeTupleMap(map, schema.items);

			return value;
		}

		const objectValue = value as Record<string, unknown>;
		if (isObject(objectValue.map)) {
			const itemSchema = Array.isArray(schema.items) ? {} : (schema.items as JsonSchema | undefined) ?? {};
			completePropertiesMap(objectValue.map as PropertiesMap, itemSchema);
		}

		return value;
	}

	return value;
}

function completeTupleMap(map: PropertiesMap, items: Array<JsonSchema | boolean>): void {
	if (Array.isArray(map))
		return;

	items.forEach((item, index) => {
		if (!isObject(item)) {
			if (!(index in map))
				map[index] = '';

			return;
		}

		if (!(index in map)) {
			map[index] = requiredPlaceholderForSchema(item);
			return;
		}

		map[index] = completeValueMap(map[index], item);
	});
}

function completePropertiesMap(map: PropertiesMap, schema: JsonSchema): void {
	if (Array.isArray(map))
		return;

	const properties = schema.properties ?? {};
	for (const requiredField of schema.required ?? []) {
		const propertySchema = properties[requiredField];
		if (!isObject(propertySchema)) {
			if (!(requiredField in map))
				map[requiredField] = '';
			continue;
		}

		if (!(requiredField in map)) {
			map[requiredField] = requiredPlaceholderForSchema(propertySchema);
			continue;
		}

		map[requiredField] = completeValueMap(map[requiredField], propertySchema);
	}
}

export function generateRequiredMappings(mapping: RootMapping, destinationSchema: JsonSchema): RootMapping {
	const type = schemaType(destinationSchema);
	if (type === 'object' || destinationSchema.properties) {
		if (!isObject(mapping))
			return requiredPlaceholderForSchema(destinationSchema) as RootMapping;

		const map = mappingMap(mapping as ValueMap);
		if (map)
			completePropertiesMap(map, destinationSchema);

		return mapping;
	}

	return completeValueMap(mapping as ValueMap, destinationSchema) as RootMapping;
}
