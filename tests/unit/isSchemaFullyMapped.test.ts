import { expect } from 'chai';
import { isSchemaFullyMapped } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import type { RootMapping } from '../../src/mappingTypes.ts';

describe('isSchemaFullyMapped', () => {
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

		expect(isSchemaFullyMapped(schema, mapping)).to.equal(true);
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

		expect(isSchemaFullyMapped(schema, {
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

		expect(isSchemaFullyMapped(schema, {
			buyer: 'BUYER'
		})).to.equal(false);
	});

	it('returns false when destination fields only have empty mapping values', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				lines: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							sku: { type: 'string' }
						}
					}
				}
			}
		};

		expect(isSchemaFullyMapped(schema, {
			id: '',
			lines: {
				forEach: '',
				map: {
					sku: 'SKU'
				}
			}
		})).to.equal(false);
	});

	it('can check required fields only', () => {
		const schema: JsonSchema = {
			type: 'object',
			required: ['id'],
			properties: {
				id: { type: 'string' },
				description: { type: 'string' }
			}
		};

		expect(isSchemaFullyMapped(schema, { id: 'ID' })).to.equal(false);
		expect(isSchemaFullyMapped(schema, { id: 'ID' }, true)).to.equal(true);
	});
});
