import { expect } from 'chai';
import {
	convertEntryValue,
	entriesToProps,
	rootToEntries,
	type ExprEntryValue
} from '../../src/react/entries.ts';

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
});
