/* eslint-disable no-use-before-define */
import type { RootMapping } from '../../mappingTypes.ts';
import type { MappingSchema } from '../types.ts';
import { schemaType } from './schemaProps.ts';

function buildInitialValue(schema: MappingSchema): unknown {
	const t = schemaType(schema);
	if (t === 'array') {
		const { items } = schema;
		const itemSchema = items && typeof items !== 'boolean' && !Array.isArray(items) ?
			items :
			undefined;

		return {
			forEach: '',
			map: itemSchema?.properties ? buildInitialProps(itemSchema.properties) : {}
		};
	}
	if (t === 'object')
		return schema.properties ? buildInitialProps(schema.properties) : {};

	return '';
}

function buildInitialProps(properties: NonNullable<MappingSchema['properties']>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [name, propDef] of Object.entries(properties)) {
		if (!propDef || typeof propDef === 'boolean')
			continue;

		result[name] = buildInitialValue(propDef);
	}
	return result;
}

export function schemaToInitialMapping(schema: MappingSchema | undefined): RootMapping {
	if (!schema?.properties)
		return {};

	return buildInitialProps(schema.properties) as RootMapping;
}
