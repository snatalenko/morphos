import { expect } from 'chai';
import { generateRequiredMappings } from '../../src/openai/utils/generateRequiredMappings.ts';
import type { JsonSchema } from '../../src/MappingSchema.ts';

describe('generateRequiredMappings', () => {
	it('fills missing required scalars, objects, and arrays', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['eventTimeZoneOffset', 'bizTransactionList', 'source'],
			properties: {
				eventTimeZoneOffset: { type: 'string' },
				bizTransactionList: {
					type: 'array',
					items: {
						type: 'object',
						required: ['type', 'bizTransaction'],
						properties: {
							type: { type: 'string' },
							bizTransaction: { type: 'string' },
							optional: { type: 'string' }
						}
					}
				},
				source: {
					type: 'object',
					required: ['type', 'location'],
					properties: {
						type: { type: 'string' },
						location: { type: 'string' },
						optional: { type: 'string' }
					}
				}
			}
		};

		expect(generateRequiredMappings({
			type: "'TransactionEvent'",
			eventTime: 'Date'
		}, destinationSchema)).to.deep.equal({
			type: "'TransactionEvent'",
			eventTime: 'Date',
			eventTimeZoneOffset: '',
			bizTransactionList: {
				forEach: '',
				map: {
					type: '',
					bizTransaction: ''
				}
			},
			source: {
				map: {
					type: '',
					location: ''
				}
			}
		});
	});

	it('replaces blank required object and array placeholders with schema-aware mappings', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['items', 'metadata'],
			properties: {
				items: {
					type: 'array',
					items: {
						type: 'object',
						required: ['sku'],
						properties: {
							sku: { type: 'string' }
						}
					}
				},
				metadata: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string' }
					}
				}
			}
		};

		expect(generateRequiredMappings({
			items: '',
			metadata: ''
		}, destinationSchema)).to.deep.equal({
			items: {
				forEach: '',
				map: {
					sku: ''
				}
			},
			metadata: {
				map: {
					id: ''
				}
			}
		});
	});
});
