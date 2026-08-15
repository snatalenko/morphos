import { expect } from 'chai';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import type { ExprEntryValue } from '../../src/react/utils/entryTypes.ts';
import {
	convertEntryValue,
	convertEntryValueForSchema
} from '../../src/react/utils/convertEntryValue.ts';
import {
	entriesToProps,
	rootToEntries
} from '../../src/react/utils/entryMapping.ts';

describe('convertEntryValue', () => {
	it('converts an existing value into a conditional then branch', () => {
		const previous: ExprEntryValue = { kind: 'expr', expr: 'status' };

		expect(convertEntryValue(previous, 'conditional')).to.deep.equal({
			kind: 'conditional',
			when: '',
			then: previous
		});
	});

	it('converts concat mappings to tuple array mappings', () => {
		expect(convertEntryValue({
			kind: 'concat',
			items: [
				{ kind: 'expr', expr: 'first' },
				{ kind: 'expr', expr: 'second' }
			]
		}, 'tuple')).to.deep.equal({
			kind: 'tuple',
			items: [
				{ kind: 'expr', expr: 'first' },
				{ kind: 'expr', expr: 'second' }
			]
		});
	});

	it('serializes converted concat rows as tuple array mappings', () => {
		const entries = rootToEntries({
			charges: {
				concat: [
					{
						kind: '"item"',
						amount: 'amount'
					},
					{
						kind: '"freight"',
						amount: 'freight'
					}
				]
			}
		});

		entries[0].value = convertEntryValue(entries[0].value, 'tuple');

		expect(entriesToProps(entries)).to.deep.equal({
			charges: {
				0: {
					kind: '"item"',
					amount: 'amount'
				},
				1: {
					kind: '"freight"',
					amount: 'freight'
				}
			}
		});
	});

	it('adds required object item fields when switching array fields to list types', () => {
		const schema: JsonSchema = {
			type: 'array',
			items: {
				type: 'object',
				required: ['kind', 'amount'],
				properties: {
					kind: { type: 'string' },
					description: { type: 'string' },
					amount: { type: 'number' }
				}
			}
		};
		const previous: ExprEntryValue = { kind: 'expr', expr: '' };
		const list = convertEntryValueForSchema(previous, 'array', schema);
		const concat = convertEntryValueForSchema(previous, 'concat', schema);
		const tuple = convertEntryValueForSchema(previous, 'tuple', schema);

		expect(list).to.deep.include({
			kind: 'array',
			forEach: ''
		});
		expect(list).to.have.nested.property('entries')
			.that.deep.includes({ id: (list as any).entries[0].id, key: 'kind', value: { kind: 'expr', expr: '' } })
			.and.deep.includes({ id: (list as any).entries[1].id, key: 'amount', value: { kind: 'expr', expr: '' } });
		expect((concat as any).items[0]).to.deep.include({
			kind: 'object',
			from: ''
		});
		expect((concat as any).items[0].entries.map((entry: any) => entry.key)).to.deep.equal(['kind', 'amount']);
		expect((tuple as any).items[0]).to.deep.include({
			kind: 'object',
			from: ''
		});
		expect((tuple as any).items[0].entries.map((entry: any) => entry.key)).to.deep.equal(['kind', 'amount']);
	});
});
