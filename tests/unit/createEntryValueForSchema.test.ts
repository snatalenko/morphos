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

	it('creates tuple entries for tuple array schemas', () => {
		expect(createEntryValueForSchema({
			type: 'array',
			items: [
				{ type: 'string' },
				{ type: 'number' }
			]
		})).to.deep.equal({
			kind: 'tuple',
			items: [
				{ kind: 'expr', expr: '' },
				{ kind: 'expr', expr: '' }
			]
		});
	});

	it('creates required object item fields for new array fields', () => {
		const value = createEntryValueForSchema({
			type: 'array',
			items: {
				type: 'object',
				required: ['kind', 'amount'],
				properties: {
					kind: { type: 'string' },
					amount: { type: 'number' }
				}
			}
		});

		expect(value).to.deep.include({
			kind: 'array',
			forEach: ''
		});
		expect((value as any).entries.map((entry: any) => entry.key)).to.deep.equal(['kind', 'amount']);
	});
});
