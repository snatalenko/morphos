import { expect } from 'chai';
import { generateInitialMapping, mappingForSchema } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';

describe('mappingForSchema', () => {
	it('is an alias for generateInitialMapping', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				lines: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							sku: { type: 'string' },
							quantity: { type: 'number' }
						}
					}
				}
			}
		};

		expect(mappingForSchema(schema)).to.deep.equal(generateInitialMapping(schema));
		expect(mappingForSchema(schema)).to.deep.equal({
			id: '',
			lines: {
				forEach: '',
				map: {
					sku: '',
					quantity: ''
				}
			}
		});
	});
});
