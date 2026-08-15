import { expect } from 'chai';
import { countMappedFields } from '../../src/index.ts';
import type { RootMapping } from '../../src/mappingTypes.ts';

describe('countMappedFields', () => {
	it('counts mapped destination fields including nested fields', () => {
		const mapping: RootMapping = {
			id: 'ID',
			buyer: {
				from: 'BUYER',
				map: {
					name: 'NAME'
				}
			},
			lines: {
				forEach: 'LINES',
				map: {
					sku: 'SKU',
					quantity: 'QTY'
				}
			},
			status: {
				when: 'PREPAID',
				then: "'paid'",
				else: "'draft'"
			},
			charges: {
				concat: [
					{
						forEach: 'LINES',
						map: {
							kind: "'item'",
							amount: 'QTY * PRICE'
						}
					},
					{
						when: 'FREIGHT > 0',
						then: {
							kind: "'freight'",
							amount: 'FREIGHT'
						}
					}
				]
			},
			tuple: {
				0: 'FIRST',
				1: {
					id: 'SECOND_ID'
				}
			}
		};

		expect(countMappedFields(mapping)).to.equal(9);
	});

	it('counts root wrapper mappings without counting instruction keys', () => {
		expect(countMappedFields({
			map: {
				id: 'ID',
				customer: {
					name: 'NAME'
				}
			}
		})).to.equal(2);
	});

	it('treats duplicate conditional branch fields as one destination field', () => {
		expect(countMappedFields({
			contact: {
				when: 'HAS_CONTACT',
				then: {
					name: 'CONTACT.NAME',
					email: 'CONTACT.EMAIL'
				},
				else: {
					name: 'BUYER.NAME'
				}
			}
		})).to.equal(2);
	});

	it('does not count fields with empty source expressions', () => {
		expect(countMappedFields({
			id: '',
			buyer: {
				map: {
					name: ''
				}
			},
			lines: {
				forEach: '',
				map: {
					sku: 'SKU'
				}
			},
			status: {
				when: '',
				then: 'STATUS'
			},
			charges: {
				concat: [
					{
						kind: '',
						amount: 'AMOUNT'
					}
				]
			}
		})).to.equal(1);
	});

	it('does not count object context mappings with empty source context', () => {
		expect(countMappedFields({
			buyer: {
				from: '',
				map: {
					name: 'NAME'
				}
			}
		})).to.equal(0);
	});

	it('counts whole value mappings', () => {
		expect(countMappedFields({
			tags: {
				forEach: 'TAGS',
				map: {
					'*': '$record'
				}
			}
		})).to.equal(1);
	});

	it('counts root element mappings', () => {
		expect(countMappedFields({
			value: {
				'*': 'SOURCE'
			}
		})).to.equal(1);
	});
});
