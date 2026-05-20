import { expect } from 'chai';
import { schemaType } from '../../src/react/utils/schemaProps.ts';

describe('schemaType', () => {
	it('returns the first declared schema type', () => {
		expect(schemaType(undefined)).to.equal(undefined);
		expect(schemaType({})).to.equal(undefined);
		expect(schemaType({ type: ['string', 'null'] })).to.equal('string');
		expect(schemaType({ type: 'number' })).to.equal('number');
	});
});
