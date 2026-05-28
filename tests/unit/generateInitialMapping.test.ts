import { expect } from 'chai';
import { generateInitialMapping } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';

describe('generateInitialMapping', () => {
	it('generates empty mappings for empty and scalar schemas', () => {
		expect(generateInitialMapping(undefined)).to.deep.equal({});
		expect(generateInitialMapping({ type: 'string' })).to.deep.equal({});
	});

	it('generates array mappings for homogeneous array schemas', () => {
		const schema: JsonSchema = {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					sku: { type: 'string' }
				}
			}
		};

		expect(generateInitialMapping(schema)).to.deep.equal({
			forEach: '',
			map: {
				sku: ''
			}
		});
	});

	it('generates positional mappings for tuple array fields', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							properties: {
								id: { type: 'string' },
								quantity: { type: 'number' }
							}
						},
						false
					]
				}
			}
		};

		expect(generateInitialMapping(schema)).to.deep.equal({
			tuple: {
				0: '',
				1: {
					id: '',
					quantity: ''
				},
				2: ''
			}
		});
	});

	it('generates positional mappings for root tuple arrays', () => {
		const schema: JsonSchema = {
			type: 'array',
			items: [
				{ type: 'string' },
				{
					type: 'object',
					properties: {
						id: { type: 'string' }
					}
				}
			]
		};

		expect(generateInitialMapping(schema)).to.deep.equal({
			0: '',
			1: {
				id: ''
			}
		});
	});
});
