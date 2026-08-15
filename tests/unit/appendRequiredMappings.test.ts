import { expect } from 'chai';
import { appendRequiredMappings } from '../../src/index.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';

describe('appendRequiredMappings', () => {
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

		expect(appendRequiredMappings({
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

	it('fills missing required boolean-schema properties', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['unknown'],
			properties: {
				unknown: true
			}
		};

		expect(appendRequiredMappings({}, destinationSchema)).to.deep.equal({
			unknown: ''
		});
	});

	it('fills missing required scalar array mappings', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tags'],
			properties: {
				tags: {
					type: 'array',
					items: { type: 'string' }
				}
			}
		};

		expect(appendRequiredMappings({}, destinationSchema)).to.deep.equal({
			tags: {
				forEach: '',
				map: {
					'*': ''
				}
			}
		});
	});

	it('keeps blank required object and array placeholders by default', () => {
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

		expect(appendRequiredMappings({
			items: '',
			metadata: ''
		}, destinationSchema)).to.deep.equal({
			items: '',
			metadata: ''
		});
	});

	it('replaces blank required object and array placeholders when enabled', () => {
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

		expect(appendRequiredMappings({
			items: '',
			metadata: ''
		}, destinationSchema, {
			replaceEmptyMappings: true
		})).to.deep.equal({
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

	it('appends required fields inside existing array item maps', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['items'],
			properties: {
				items: {
					type: 'array',
					items: {
						type: 'object',
						required: ['sku', 'quantity'],
						properties: {
							sku: { type: 'string' },
							quantity: { type: 'number' }
						}
					}
				}
			}
		};

		expect(appendRequiredMappings({
			items: {
				forEach: 'LINES',
				map: {
					sku: 'ITEM'
				}
			}
		}, destinationSchema)).to.deep.equal({
			items: {
				forEach: 'LINES',
				map: {
					sku: 'ITEM',
					quantity: ''
				}
			}
		});
	});

	it('keeps conditional mappings when required nested objects already use conditions', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['metadata'],
			properties: {
				metadata: {
					type: 'object',
					required: ['id'],
					properties: {
						id: { type: 'string' }
					}
				}
			}
		};
		const mapping = {
			metadata: {
				when: 'HAS_METADATA',
				then: {
					id: 'ID'
				}
			}
		};

		expect(appendRequiredMappings(mapping, destinationSchema)).to.deep.equal(mapping);
	});

	it('uses positional object placeholders for tuple arrays', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tuple'],
			properties: {
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							required: ['id'],
							properties: {
								id: { type: 'string' },
								optional: { type: 'string' }
							}
						}
					]
				}
			}
		};

		expect(appendRequiredMappings({}, destinationSchema)).to.deep.equal({
			tuple: {
				0: '',
				1: {
					map: {
						id: ''
					}
				}
			}
		});
	});

	it('fills missing tuple array positions for boolean tuple item schemas', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tuple'],
			properties: {
				tuple: {
					type: 'array',
					items: [
						false,
						{
							type: 'object',
							required: ['id'],
							properties: {
								id: { type: 'string' }
							}
						}
					]
				}
			}
		};

		expect(appendRequiredMappings({
			tuple: {
				1: {
					map: {
						id: 'sourceId'
					}
				}
			}
		}, destinationSchema)).to.deep.equal({
			tuple: {
				0: '',
				1: {
					map: {
						id: 'sourceId'
					}
				}
			}
		});
	});

	it('fills missing tuple array positions in existing mappings', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tuple'],
			properties: {
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							required: ['id'],
							properties: {
								id: { type: 'string' }
							}
						}
					]
				}
			}
		};

		expect(appendRequiredMappings({
			tuple: {
				0: 'sourceValue'
			}
		}, destinationSchema)).to.deep.equal({
			tuple: {
				0: 'sourceValue',
				1: {
					map: {
						id: ''
					}
				}
			}
		});
	});

	it('keeps blank tuple array placeholders by default', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tuple'],
			properties: {
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							required: ['id'],
							properties: {
								id: { type: 'string' }
							}
						}
					]
				}
			}
		};

		expect(appendRequiredMappings({
			tuple: ''
		}, destinationSchema)).to.deep.equal({
			tuple: ''
		});
	});

	it('replaces blank tuple array placeholders when enabled', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tuple'],
			properties: {
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							required: ['id'],
							properties: {
								id: { type: 'string' }
							}
						}
					]
				}
			}
		};

		expect(appendRequiredMappings({
			tuple: ''
		}, destinationSchema, {
			replaceEmptyMappings: true
		})).to.deep.equal({
			tuple: {
				0: '',
				1: {
					map: {
						id: ''
					}
				}
			}
		});
	});

	it('fills required fields inside existing tuple object item mappings', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['tuple'],
			properties: {
				tuple: {
					type: 'array',
					items: [
						{ type: 'string' },
						{
							type: 'object',
							required: ['id', 'type'],
							properties: {
								id: { type: 'string' },
								type: { type: 'string' }
							}
						}
					]
				}
			}
		};

		expect(appendRequiredMappings({
			tuple: {
				1: {
					map: {
						id: 'sourceId'
					}
				}
			}
		}, destinationSchema)).to.deep.equal({
			tuple: {
				0: '',
				1: {
					map: {
						id: 'sourceId',
						type: ''
					}
				}
			}
		});
	});

	it('replaces root object placeholders when enabled', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['id'],
			properties: {
				id: { type: 'string' }
			}
		};

		expect(appendRequiredMappings('' as never, destinationSchema, {
			replaceEmptyMappings: true
		})).to.deep.equal({
			map: {
				id: ''
			}
		});
	});

	it('replaces root object placeholders with boolean-schema required fields', () => {
		const destinationSchema: JsonSchema = {
			type: 'object',
			required: ['unknown'],
			properties: {
				unknown: true
			}
		};

		expect(appendRequiredMappings('' as never, destinationSchema, {
			replaceEmptyMappings: true
		})).to.deep.equal({
			map: {
				unknown: ''
			}
		});
	});

	it('keeps scalar mappings for scalar destination schemas', () => {
		expect(appendRequiredMappings('AMOUNT' as never, {
			type: 'number'
		})).to.equal('AMOUNT');
	});
});
