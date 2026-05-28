import { expect } from 'chai';
import { createEntryValueForSchema } from '../../src/react/utils/createEntryValueForSchema.ts';

describe('createEntryValueForSchema', () => {
	it('creates empty editor values for object and scalar schemas', () => {
		expect(createEntryValueForSchema({
			type: 'object',
			properties: {
				id: { type: 'string' }
			}
		})).to.deep.equal({
			kind: 'object',
			from: '',
			entries: []
		});
		expect(createEntryValueForSchema({ type: 'string' })).to.deep.equal({
			kind: 'expr',
			expr: ''
		});
	});
});
