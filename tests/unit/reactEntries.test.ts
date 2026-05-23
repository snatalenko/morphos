import { expect } from 'chai';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import {
	convertEntryValue,
	convertEntryValueForSchema,
	entriesToProps,
	rootToEntries,
	type ExprEntryValue
} from '../../src/react/utils/entries.ts';
import { createEntryValueForSchema } from '../../src/react/utils/createEntryValueForSchema.ts';
import { getTupleItemSchema } from '../../src/react/utils/schemaProps.ts';

describe('react entries', () => {

	it('round-trips conditional mappings', () => {
		const mapping = {
			status: {
				when: 'cancelledAt',
				then: '"cancelled"',
				else: '"active"'
			},
			billOfLading: {
				when: 'shipment.billOfLadingNumber',
				then: 'shipment.billOfLadingNumber'
			}
		};

		expect(entriesToProps(rootToEntries(mapping))).to.deep.equal(mapping);
	});

	it('converts an existing value into a conditional then branch', () => {
		const previous: ExprEntryValue = { kind: 'expr', expr: 'status' };

		expect(convertEntryValue(previous, 'conditional')).to.deep.equal({
			kind: 'conditional',
			when: '',
			then: previous
		});
	});

	it('round-trips concat mappings', () => {
		const mapping = {
			bizTransactions: {
				concat: [
					{
						when: 'shipment.purchaseOrderNumber',
						then: {
							type: '"po"',
							bizTransaction: 'shipment.purchaseOrderNumber'
						}
					},
					{
						when: 'shipment.asnNumber',
						then: {
							type: '"desadv"',
							bizTransaction: 'shipment.asnNumber'
						}
					}
				]
			}
		};

		expect(entriesToProps(rootToEntries(mapping))).to.deep.equal(mapping);
	});

	it('round-trips tuple array mappings as numeric-key objects', () => {
		const mapping = {
			tuple: {
				0: 'sku',
				1: {
					id: 'id',
					quantity: 'Number(quantity)'
				},
				2: {
					concat: [
						'primary',
						'secondary'
					]
				}
			}
		};

		expect(entriesToProps(rootToEntries(mapping))).to.deep.equal(mapping);
	});

	it('recognizes JSON arrays as tuple array mappings', () => {
		const mapping = {
			tuple: [
				'sku',
				'quantity'
			]
		};

		expect(entriesToProps(rootToEntries(mapping))).to.deep.equal({
			tuple: {
				0: 'sku',
				1: 'quantity'
			}
		});
	});

	it('round-trips wildcard spread mappings with explicit overrides', () => {
		const mapping = {
			'*': '*',
			modified: 'x + 1'
		};

		expect(entriesToProps(rootToEntries(mapping))).to.deep.equal(mapping);
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

	it('uses homogeneous array item schemas for tuple editor items', () => {
		const itemSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				quantity: { type: 'number' }
			}
		} as const;

		expect(getTupleItemSchema({
			type: 'array',
			items: itemSchema
		}, 0)).to.equal(itemSchema);
		expect(getTupleItemSchema({
			type: 'array',
			items: itemSchema
		}, 1)).to.equal(itemSchema);
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
