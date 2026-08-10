import { expect } from 'chai';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import {
	findSourceFields,
	parseSourcePath,
	resolveSourcePath
} from '../../src/react/utils/sourceFields.ts';
import { getItemsSchema } from '../../src/react/utils/schemaProps.ts';
import { parentContextSuggestions } from '../../src/react/utils/sourceSuggestions.ts';

describe('source field utilities', () => {
	const sourceSchema: JsonSchema = {
		type: 'object',
		properties: {
			HEADER: {
				type: 'object',
				properties: {
					BUYER: {
						type: 'object',
						properties: {
							NAME: { type: 'string' }
						}
					}
				}
			},
			DETAILS: {
				type: 'object',
				properties: {
					LINE_ITEMS: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								SKU: { type: 'string' }
							}
						}
					}
				}
			},
			TOTAL: { type: 'number' }
		}
	};

	it('parses source paths with dot and bracket property access', () => {
		expect(parseSourcePath('HEADER.BUYER')).to.deep.equal(['HEADER', 'BUYER']);
		expect(parseSourcePath('HEADER[\'BUYER\']')).to.deep.equal(['HEADER', 'BUYER']);
		expect(parseSourcePath('DETAILS["LINE_ITEMS"]')).to.deep.equal(['DETAILS', 'LINE_ITEMS']);
		expect(parseSourcePath('["HEADER"].BUYER')).to.deep.equal(['HEADER', 'BUYER']);
		expect(parseSourcePath('HEADER[BUYER]')).to.equal(undefined);
	});

	it('resolves source schemas from quoted bracket property paths', () => {
		expect(resolveSourcePath(sourceSchema, 'HEADER[\'BUYER\']'))
			.to.equal((sourceSchema.properties?.HEADER as JsonSchema).properties?.BUYER);
		expect(resolveSourcePath(sourceSchema, 'DETAILS["LINE_ITEMS"]'))
			.to.equal((sourceSchema.properties?.DETAILS as JsonSchema).properties?.LINE_ITEMS);
	});

	it('lists inner object field suggestions from quoted from paths', () => {
		const buyerSchema = resolveSourcePath(sourceSchema, 'HEADER[\'BUYER\']');

		expect(Array.from(findSourceFields(buyerSchema, {}), s => s.path))
			.to.deep.equal(['NAME']);
	});

	it('lists inner array item field suggestions from quoted forEach paths', () => {
		const lineItemsSchema = resolveSourcePath(sourceSchema, 'DETAILS["LINE_ITEMS"]');
		const lineItemSchema = lineItemsSchema ? getItemsSchema(lineItemsSchema) : undefined;

		expect(Array.from(findSourceFields(lineItemSchema, {}), s => s.path))
			.to.deep.equal(['SKU']);
	});

	it('lists fields from nested allOf, oneOf, and anyOf schemas without duplicates', () => {
		const composedSchema: JsonSchema = {
			allOf: [
				{
					type: 'object',
					properties: {
						id: { type: 'string' }
					}
				},
				{
					oneOf: [
						{
							type: 'object',
							properties: {
								id: { type: 'string' },
								name: { type: 'string' }
							}
						},
						{
							anyOf: [
								{
									type: 'object',
									properties: {
										email: { type: 'string' }
									}
								},
								{
									type: 'object',
									properties: {
										phone: { type: 'string' }
									}
								}
							]
						}
					]
				}
			]
		};

		expect(Array.from(findSourceFields(composedSchema, {}), field => field.path))
			.to.deep.equal(['id', 'name', 'email', 'phone']);
	});

	it('omits bracket paths without a base and keeps them when the full path is specified', () => {
		const extendedProperty = 'urn:example:schemas:scim:User:social';
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				[extendedProperty]: { type: 'string' },
				$sources: {
					type: 'object',
					properties: {
						$input: {
							type: 'object',
							properties: {
								[extendedProperty]: { type: 'string' }
							}
						}
					}
				}
			}
		};

		expect(Array.from(findSourceFields(schema, { type: 'string' }), field => field.path))
			.to.deep.equal(['$sources.$input["urn:example:schemas:scim:User:social"]']);
	});

	it('resolves properties nested in schema composition keywords', () => {
		const composedSchema: JsonSchema = {
			allOf: [{
				oneOf: [{
					anyOf: [{
						type: 'object',
						properties: {
							contact: {
								type: 'object',
								properties: {
									email: { type: 'string' }
								}
							}
						}
					}]
				}]
			}]
		};

		expect(resolveSourcePath(composedSchema, 'contact.email'))
			.to.deep.equal({ type: 'string' });
	});

	it('filters consumed parent suggestions for quoted bracket property paths', () => {
		const suggestions = parentContextSuggestions(sourceSchema, [], 'DETAILS["LINE_ITEMS"]');

		expect(suggestions.map(s => s.path)).to.not.include.members([
			'DETAILS',
			'DETAILS.LINE_ITEMS'
		]);
		expect(suggestions.map(s => s.path)).to.include('TOTAL');
	});
});
