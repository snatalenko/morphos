import { expect } from 'chai';
import {
	entriesToRootMapping,
	entriesToProps,
	rootToEntries
} from '../../src/react/utils/entryMapping.ts';

describe('entryMapping', () => {
	it('round-trips top-level conditional mappings', () => {
		const mapping = {
			when: 'recordType === \'invoice\'',
			then: {
				invoiceNumber: 'docNo',
				totalAmount: 'total'
			},
			else: {
				documentType: '\'ignored\''
			}
		};

		const entries = rootToEntries(mapping);

		expect(entries).to.have.length(1);
		expect(entries[0]).to.deep.include({ key: '*', rootValue: true });
		expect(entries[0].value).to.deep.include({
			kind: 'conditional',
			when: 'recordType === \'invoice\''
		});
		expect(entriesToRootMapping(entries)).to.deep.equal(mapping);
	});

	it('round-trips top-level concat mappings', () => {
		const mapping = {
			concat: [
				{
					when: 'purchaseOrderNumber',
					then: {
						type: '\'po\'',
						bizTransaction: 'purchaseOrderNumber'
					}
				}
			]
		};

		const entries = rootToEntries(mapping);

		expect(entries).to.have.length(1);
		expect(entries[0]).to.deep.include({ key: '*', rootValue: true });
		expect(entriesToRootMapping(entries)).to.deep.equal(mapping);
	});

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
});
