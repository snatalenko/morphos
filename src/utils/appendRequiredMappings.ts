import type { PropertiesMap, RootMapping, ValueMap } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { isJsonSchema, isRecord, schemaItems, schemaType } from './jsonSchemaUtils.ts';

export interface AppendRequiredMappingsOptions {
	replaceEmptyMappings?: boolean;
}

function schemaObjectMap(schema: JsonSchema): PropertiesMap {
	const result: PropertiesMap = {};
	const properties = schema.properties ?? {};
	for (const requiredField of schema.required ?? []) {
		const propertySchema = properties[requiredField];
		if (isJsonSchema(propertySchema))
			result[requiredField] = requiredPlaceholderForSchema(propertySchema);
		else
			result[requiredField] = '';
	}

	return result;
}

function schemaArrayMap(schema: JsonSchema): PropertiesMap {
	const items = schemaItems(schema);
	if (items && schemaType(items) === 'object')
		return schemaObjectMap(items);

	return { '*': items ? requiredPlaceholderForSchema(items) : '' };
}

function schemaTupleMap(items: Array<JsonSchema | boolean>): PropertiesMap {
	const map: PropertiesMap = {};
	items.forEach((item, index) => {
		map[index] = isJsonSchema(item) ? requiredPlaceholderForSchema(item) : '';
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
	if (!isRecord(value))
		return undefined;

	const objectValue = value as Record<string, unknown>;
	if (isRecord(objectValue.map))
		return objectValue.map as PropertiesMap;
	if ('forEach' in value || 'from' in value || 'when' in value || 'concat' in value)
		return undefined;

	return value as PropertiesMap;
}

function shouldReplaceValue(value: ValueMap, options: AppendRequiredMappingsOptions): boolean {
	if (value === '')
		return options.replaceEmptyMappings === true;

	return !isRecord(value);
}

function completeValueMap(
	value: ValueMap,
	schema: JsonSchema,
	options: AppendRequiredMappingsOptions
): ValueMap {
	const type = schemaType(schema);
	if (type === 'object' || schema.properties) {
		if (shouldReplaceValue(value, options))
			return requiredPlaceholderForSchema(schema);

		const map = mappingMap(value);
		if (map)
			completePropertiesMap(map, schema, options);

		return value;
	}
	if (type === 'array') {
		if (shouldReplaceValue(value, options))
			return requiredPlaceholderForSchema(schema);

		if (Array.isArray(schema.items)) {
			const map = mappingMap(value);
			if (map)
				completeTupleMap(map, schema.items, options);

			return value;
		}

		const objectMap = isRecord(value) ? (value as Record<string, unknown>).map : undefined;
		if (isRecord(objectMap)) {
			const itemSchema = schemaItems(schema) ?? {};
			completePropertiesMap(objectMap as PropertiesMap, itemSchema, options);
		}

		return value;
	}

	return value;
}

function completeTupleMap(
	map: PropertiesMap,
	items: Array<JsonSchema | boolean>,
	options: AppendRequiredMappingsOptions
): void {
	items.forEach((item, index) => {
		if (!isJsonSchema(item)) {
			if (!(index in map))
				map[index] = '';

			return;
		}

		if (!(index in map)) {
			map[index] = requiredPlaceholderForSchema(item);
			return;
		}

		map[index] = completeValueMap(map[index], item, options);
	});
}

function completePropertiesMap(
	map: PropertiesMap,
	schema: JsonSchema,
	options: AppendRequiredMappingsOptions
): void {
	const properties = schema.properties ?? {};
	for (const requiredField of schema.required ?? []) {
		const propertySchema = properties[requiredField];
		if (!isJsonSchema(propertySchema)) {
			if (!(requiredField in map))
				map[requiredField] = '';
			continue;
		}

		if (!(requiredField in map)) {
			map[requiredField] = requiredPlaceholderForSchema(propertySchema);
			continue;
		}

		map[requiredField] = completeValueMap(map[requiredField], propertySchema, options);
	}
}

export function appendRequiredMappings(
	mapping: RootMapping,
	destinationSchema: JsonSchema,
	options: AppendRequiredMappingsOptions = {}
): RootMapping {
	const type = schemaType(destinationSchema);
	if (type === 'object' || destinationSchema.properties) {
		if (shouldReplaceValue(mapping as ValueMap, options))
			return requiredPlaceholderForSchema(destinationSchema) as RootMapping;

		const map = mappingMap(mapping as ValueMap);
		if (map)
			completePropertiesMap(map, destinationSchema, options);

		return mapping;
	}

	return completeValueMap(mapping as ValueMap, destinationSchema, options) as RootMapping;
}
