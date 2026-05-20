import { expect } from 'chai';
import { listDestinationSchemaFieldEntries } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import type { RootMapping } from '../../src/mappingTypes.ts';

describe('listDestinationSchemaFieldEntries', () => {
	it('lists destination schema leaf fields with mapped status', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				buyer: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						taxId: { type: 'string' }
					}
				},
				lines: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							sku: { type: 'string' },
							quantity: { type: 'number' }
						}
					}
				},
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							properties: {
								code: { type: 'string' }
							}
						}
					]
				},
				unknown: true
			}
		};
		const mapping: RootMapping = {
			id: 'ID',
			buyer: {
				from: 'BUYER',
				map: {
					name: 'NAME',
					taxId: ''
				}
			},
			lines: {
				forEach: 'LINES',
				map: {
					sku: 'SKU'
				}
			},
			tuple: {
				0: '',
				1: {
					code: 'SECOND_CODE'
				}
			}
		};

		const fields = Array.from(
			listDestinationSchemaFieldEntries(schema, mapping),
			({ path, mapped }) => ({ path, mapped })
		);

		expect(fields).to.deep.equal([
			{ path: 'id', mapped: true },
			{ path: 'buyer.name', mapped: true },
			{ path: 'buyer.taxId', mapped: false },
			{ path: 'lines.sku', mapped: true },
			{ path: 'lines.quantity', mapped: false },
			{ path: 'tuple.0', mapped: false },
			{ path: 'tuple.1.code', mapped: true },
			{ path: 'unknown', mapped: false }
		]);
	});

	it('includes scalar array fields and empty object fields', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				tags: {
					type: 'array',
					items: { type: 'string' }
				},
				metadata: {
					type: 'object',
					properties: {}
				}
			}
		};

		const fields = Array.from(listDestinationSchemaFieldEntries(schema, {
			tags: {
				forEach: 'TAGS',
				map: {
					'*': '$record'
				}
			}
		}), ({ path, mapped }) => ({ path, mapped }));

		expect(fields).to.deep.equal([
			{ path: 'tags', mapped: true },
			{ path: 'metadata', mapped: false }
		]);
	});
});
