import type { RootMapping } from '../../src/mappingTypes.ts';
import type { JsonSchema } from '../../src/JsonSchema.ts';

export const sourceData = {
	PO_HDR: {
		PO_NO: 'PO-450001',
		CURR: 'USD'
	},
	TERMS_DAYS: 30,
	PREPAID: false,
	FREIGHT_AMT: 25,
	BUYER: {
		NAME: 'Acme Retail',
		TAX_ID: 'US-123456789'
	},
	SHIP_TO: {
		CITY: 'Chicago'
	},
	LINES: [
		{ ITEM_NO: 'SKU-100', QTY: 2, UNIT_PRICE: 12.5 },
		{ ITEM_NO: 'SKU-200', QTY: 1, UNIT_PRICE: 40 }
	]
};

export const initial: RootMapping = {
	invoiceNumber: "'INV-' + PO_HDR.PO_NO",
	purchaseOrderNumber: 'PO_HDR.PO_NO',
	currency: 'PO_HDR.CURR',
	paymentTermsDays: 'TERMS_DAYS',
	buyer: {
		from: 'BUYER',
		map: {
			name: 'NAME',
			taxId: 'TAX_ID'
		}
	},
	shipTo: {
		name: 'BUYER.NAME',
		city: 'SHIP_TO.CITY'
	},
	lines: {
		forEach: 'LINES',
		map: {
			sku: 'ITEM_NO',
			quantity: 'QTY',
			netAmount: 'QTY * UNIT_PRICE'
		}
	},
	invoiceStatus: {
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
					description: 'ITEM_NO',
					amount: 'QTY * UNIT_PRICE'
				}
			},
			{
				when: 'FREIGHT_AMT > 0',
				then: {
					kind: "'freight'",
					description: "'Freight'",
					amount: 'FREIGHT_AMT'
				}
			}
		]
	},
	totalAmount: 'LINES.reduce((sum, line) => sum + (line.QTY * line.UNIT_PRICE), FREIGHT_AMT || 0)'
};

export const sourceSchema: JsonSchema = {
	type: 'object',
	title: 'Purchase Order',
	description: 'Customer purchase order used as the invoice source document.',
	required: ['PO_HDR', 'BUYER', 'LINES'],
	properties: {
		PO_HDR: {
			type: 'object',
			description: 'Purchase order header',
			required: ['PO_NO', 'CURR'],
			properties: {
				PO_NO: { type: 'string', description: 'Purchase order number' },
				CURR: { type: 'string', description: 'Currency code' }
			}
		},
		TERMS_DAYS: { type: 'number', description: 'Payment terms in days' },
		PREPAID: { type: 'boolean', description: 'Whether the order was prepaid' },
		FREIGHT_AMT: { type: 'number', description: 'Freight charge to invoice when present' },
		BUYER: {
			type: 'object',
			description: 'Buyer account',
			properties: {
				NAME: { type: 'string', description: 'Buyer legal name' },
				TAX_ID: { type: 'string', description: 'Buyer tax identifier' }
			}
		},
		SHIP_TO: {
			type: 'object',
			description: 'Delivery destination',
			properties: {
				CITY: { type: 'string', description: 'Ship-to city' }
			}
		},
		LINES: {
			type: 'array',
			description: 'Purchase order lines',
			items: {
				type: 'object',
				required: ['ITEM_NO', 'QTY', 'UNIT_PRICE'],
				properties: {
					ITEM_NO: { type: 'string', description: 'Item SKU' },
					QTY: { type: 'number', description: 'Ordered quantity' },
					UNIT_PRICE: { type: 'number', description: 'Unit price' }
				}
			}
		}
	}
};

export const destinationSchema: JsonSchema = {
	type: 'object',
	title: 'Invoice',
	description: 'Invoice document created from a customer purchase order.',
	required: ['invoiceNumber', 'purchaseOrderNumber', 'currency', 'lines', 'charges', 'totalAmount'],
	properties: {
		invoiceNumber: { type: 'string', description: 'Generated invoice number' },
		purchaseOrderNumber: { type: 'string', description: 'Original purchase order number' },
		currency: { type: 'string', description: 'Invoice currency' },
		paymentTermsDays: { type: 'number', description: 'Payment terms in days' },
		buyer: {
			type: 'object',
			description: 'Bill-to account',
			properties: {
				name: { type: 'string', description: 'Bill-to name' },
				taxId: { type: 'string', description: 'Bill-to tax identifier' }
			}
		},
		shipTo: {
			type: 'object',
			description: 'Ship-to destination',
			properties: {
				name: { type: 'string', description: 'Ship-to name' },
				city: { type: 'string', description: 'Ship-to city' }
			}
		},
		lines: {
			type: 'array',
			description: 'Invoice lines',
			items: {
				type: 'object',
				required: ['sku', 'quantity', 'netAmount'],
				properties: {
					sku: { type: 'string', description: 'Invoiced SKU' },
					quantity: { type: 'number', description: 'Invoiced quantity' },
					netAmount: { type: 'number', description: 'Line net amount' }
				}
			}
		},
		invoiceStatus: {
			type: 'string',
			description: 'Invoice workflow status',
			enum: ['paid', 'draft']
		},
		charges: {
			type: 'array',
			description: 'Item and freight charges',
			items: {
				type: 'object',
				required: ['kind', 'amount'],
				properties: {
					kind: { type: 'string', enum: ['item', 'freight'], description: 'Charge type' },
					description: { type: 'string', description: 'Charge description' },
					amount: { type: 'number', description: 'Charge amount' }
				}
			}
		},
		totalAmount: { type: 'number', description: 'Invoice total including freight' }
	}
};
