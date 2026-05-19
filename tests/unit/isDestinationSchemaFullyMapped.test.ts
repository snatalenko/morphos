import { expect } from 'chai';
import { isDestinationSchemaFullyMapped } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import type { RootMapping } from '../../src/mappingTypes.ts';

describe('isDestinationSchemaFullyMapped', () => {
	it('returns true when every destination schema field is mapped', () => {
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
				charges: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							kind: { type: 'string' },
							amount: { type: 'number' }
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
					taxId: 'TAX_ID'
				}
			},
			lines: {
				forEach: 'LINES',
				map: {
					sku: 'SKU',
					quantity: 'QTY'
				}
			},
			charges: {
				concat: [
					{
						forEach: 'LINES',
						map: {
							kind: "'item'",
							amount: 'AMOUNT'
						}
					},
					{
						when: 'FREIGHT > 0',
						then: {
							kind: "'freight'",
							amount: 'FREIGHT'
						}
					}
				]
			},
			tuple: {
				0: 'FIRST',
				1: {
					code: 'SECOND_CODE'
				}
			},
			unknown: 'UNKNOWN'
		};

		expect(isDestinationSchemaFullyMapped(schema, mapping)).to.equal(true);
	});

	it('returns false when a nested destination schema field is missing', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				buyer: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						taxId: { type: 'string' }
					}
				}
			}
		};

		expect(isDestinationSchemaFullyMapped(schema, {
			buyer: {
				name: 'NAME'
			}
		})).to.equal(false);
	});

	it('returns false when an object destination is mapped as a scalar field', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				buyer: {
					type: 'object',
					properties: {
						name: { type: 'string' }
					}
				}
			}
		};

		expect(isDestinationSchemaFullyMapped(schema, {
			buyer: 'BUYER'
		})).to.equal(false);
	});
});
