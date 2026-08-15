import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import {
	isJsonSchema,
	schemaItems,
	schemaPropertyEntries,
	schemaTupleItems,
	schemaType
} from './jsonSchemaUtils.ts';

function buildInitialValue(schema: JsonSchema): unknown {
	const t = schemaType(schema);
	if (t === 'array') {
		const tupleItems = schemaTupleItems(schema);
		if (tupleItems)
			return buildInitialTuple(tupleItems);

		const itemSchema = schemaItems(schema);

		return {
			forEach: '',
			map: itemSchema?.properties ? buildInitialProps(itemSchema.properties) : {}
		};
	}
	if (t === 'object')
		return schema.properties ? buildInitialProps(schema.properties) : {};

	return '';
}

function buildInitialTuple(items: Array<JsonSchema | boolean>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	items.forEach((item, index) => {
		result[index] = isJsonSchema(item) ? buildInitialValue(item) : '';
	});
	return result;
}

function buildInitialProps(properties: NonNullable<JsonSchema['properties']>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [name, propDef] of schemaPropertyEntries(properties))
		result[name] = buildInitialValue(propDef);

	return result;
}

export function generateInitialMapping(schema: JsonSchema | undefined): RootMapping {
	if (!schema)
		return {};

	const initialValue = buildInitialValue(schema);
	return typeof initialValue === 'string' ? {} : initialValue as RootMapping;
}
