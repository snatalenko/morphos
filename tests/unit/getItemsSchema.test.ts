import { expect } from 'chai';
import { getItemsSchema } from '../../src/react/utils/schemaProps.ts';

describe('getItemsSchema', () => {
	it('returns homogeneous item schemas only', () => {
		const itemSchema = { type: 'string' } as const;

		expect(getItemsSchema(undefined)).to.equal(undefined);
		expect(getItemsSchema({ type: 'array' })).to.equal(undefined);
		expect(getItemsSchema({ type: 'array', items: [itemSchema] })).to.equal(undefined);
		expect(getItemsSchema({ type: 'array', items: false })).to.equal(undefined);
		expect(getItemsSchema({ type: 'array', items: itemSchema })).to.equal(itemSchema);
	});
});
