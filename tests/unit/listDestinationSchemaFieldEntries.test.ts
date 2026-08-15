import { expect } from 'chai';
import { listDestinationSchemaFieldEntries } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import type { RootMapping } from '../../src/mappingTypes.ts';

describe('listDestinationSchemaFieldEntries', () => {
	it('lists destination schema leaf fields with mapped status', () => {
		const schema: JsonSchema = {
			type: 'object',
			required: ['id', 'buyer', 'lines', 'tuple'],
			properties: {
				id: { type: 'string' },
				buyer: {
					type: 'object',
					required: ['name'],
					properties: {
						name: { type: 'string' },
						taxId: { type: 'string' }
					}
				},
				lines: {
					type: 'array',
					items: {
						type: 'object',
						required: ['sku'],
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
							required: ['code'],
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
			({ path, mapped, required }) => ({ path, mapped, required })
		);

		expect(fields).to.deep.equal([
			{ path: 'id', mapped: true, required: true },
			{ path: 'buyer.name', mapped: true, required: true },
			{ path: 'buyer.taxId', mapped: false, required: false },
			{ path: 'lines.sku', mapped: true, required: true },
			{ path: 'lines.quantity', mapped: false, required: false },
			{ path: 'tuple.0', mapped: false, required: true },
			{ path: 'tuple.1.code', mapped: true, required: true },
			{ path: 'unknown', mapped: false, required: false }
		]);
	});

	it('does not mark nested fields as required when the parent field is optional', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				buyer: {
					type: 'object',
					required: ['name'],
					properties: {
						name: { type: 'string' }
					}
				}
			}
		};

		const fields = Array.from(
			listDestinationSchemaFieldEntries(schema, {}),
			({ path, required }) => ({ path, required })
		);

		expect(fields).to.deep.equal([
			{ path: 'buyer.name', required: false }
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

	it('includes boolean tuple item schemas', () => {
		const schema: JsonSchema = {
			type: 'array',
			items: [
				true,
				false
			]
		};

		const fields = Array.from(listDestinationSchemaFieldEntries(schema, {}), entry => ({
			path: entry.path,
			schema: entry.schema,
			mapped: entry.mapped,
			required: entry.required
		}));

		expect(fields).to.deep.equal([
			{ path: '0', schema: true, mapped: false, required: true },
			{ path: '1', schema: false, mapped: false, required: true }
		]);
	});
});
