import { expect } from 'chai';
import { schemaItems, schemaType } from '../../src/shared/jsonSchemaUtils.ts';

describe('jsonSchemaUtils', () => {
	it('resolves missing and nullable schema types', () => {
		expect(schemaType(undefined)).to.equal(undefined);
		expect(schemaType({})).to.equal(undefined);
		expect(schemaType({ type: ['null', 'object'] })).to.equal('object');
		expect(schemaType({ type: ['null'] })).to.equal('null');
	});

	it('does not treat tuple items as homogeneous array items', () => {
		expect(schemaItems({
			type: 'array',
			items: [{ type: 'string' }]
		})).to.equal(undefined);
	});
});
