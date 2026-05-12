import type { RootMapping } from '../../src/mappingTypes.ts';
import type { MappingSchema } from '../../src/react/index.ts';

export const initial: RootMapping = {
	salesOrderId: 'poHeader.poNo',
	createdOn: 'poHeader.issuedAt',
	status: "'accepted'",
	currency: 'poHeader.money',
	customer: {
		from: 'buyer',
		map: {
			accountCode: 'gln',
			displayName: 'legalName',
			email: 'contactEmail'
		}
	},
	delivery: {
		name: 'destination.label',
		address: {
			street: 'destination.street1',
			city: 'destination.town',
			postalCode: 'destination.zip',
			country: 'destination.countryCode'
		}
	},
	items: {
		forEach: 'rows',
		map: {
			position: '$index + 1',
			customerLine: 'lineRef',
			sku: 'vendorSku ?? customerSku',
			name: 'itemText',
			qty: 'orderedQty',
			price: 'netPrice',
			amount: 'Number(orderedQty) * Number(netPrice)',
			needByDates: {
				forEach: 'schedule ?? []',
				map: {
					'*': 'dueOn'
				}
			},
			sourcePo: '$input.poHeader.poNo'
		}
	},
	totalAmount: 'rows.reduce((sum, row) => sum + (Number(row.orderedQty) * Number(row.netPrice)), 0)'
};

export const sourceSchema: MappingSchema = {
	type: 'object',
	title: 'Buyer purchase order',
	description: 'Customer purchase order document sent to a supplier.',
	required: ['poHeader', 'buyer', 'rows'],
	properties: {
		poHeader: {
			type: 'object',
			description: 'Purchase order header',
			required: ['poNo', 'issuedAt', 'money'],
			properties: {
				poNo: { type: 'string', description: 'Customer purchase order number' },
				issuedAt: { type: 'string', description: 'Purchase order issue date' },
				money: { type: 'string', description: 'Currency code for prices and totals' }
			}
		},
		buyer: {
			type: 'object',
			description: 'Buyer account that placed the order',
			properties: {
				gln: { type: 'string', description: 'Buyer GLN or account identifier' },
				legalName: { type: 'string', description: 'Buyer legal name' },
				contactEmail: { type: 'string', description: 'Buyer purchasing contact email' }
			}
		},
		destination: {
			type: 'object',
			description: 'Requested delivery location',
			properties: {
				label: { type: 'string', description: 'Receiving location name' },
				street1: { type: 'string', description: 'Delivery street address' },
				town: { type: 'string', description: 'Delivery city or town' },
				zip: { type: 'string', description: 'Delivery postal code' },
				countryCode: { type: 'string', description: 'Delivery country code' }
			}
		},
		rows: {
			type: 'array',
			description: 'Purchase order item rows',
			items: {
				type: 'object',
				required: ['lineRef', 'customerSku', 'orderedQty', 'netPrice'],
				properties: {
					lineRef: { type: 'integer', description: 'Customer line number' },
					customerSku: { type: 'string', description: 'Customer item number' },
					vendorSku: { type: 'string', description: 'Supplier item number, when known' },
					itemText: { type: 'string', description: 'Item description' },
					orderedQty: { type: 'number', description: 'Ordered quantity' },
					netPrice: { type: 'number', description: 'Unit purchase price' },
					schedule: {
						type: 'array',
						description: 'Requested delivery dates for this row',
						items: {
							type: 'object',
							properties: {
								dueOn: { type: 'string', description: 'Requested delivery date' },
								qty: { type: 'number', description: 'Quantity requested on this date' }
							}
						}
					}
				}
			}
		}
	}
};

export const destinationSchema: MappingSchema = {
	type: 'object',
	title: 'Supplier sales order',
	description: 'Sales order created from a customer purchase order.',
	required: ['salesOrderId', 'createdOn', 'status', 'items', 'totalAmount'],
	properties: {
		salesOrderId: { type: 'string', description: 'Sales order identifier initialized from customer PO' },
		createdOn: { type: 'string', description: 'Sales order creation date' },
		status: { type: 'string', description: 'Sales order status' },
		currency: { type: 'string', description: 'Currency used for order amounts' },
		customer: {
			type: 'object',
			description: 'Customer account on the sales order',
			properties: {
				accountCode: { type: 'string', description: 'Customer account identifier' },
				displayName: { type: 'string', description: 'Customer display name' },
				email: { type: 'string', description: 'Customer contact email' }
			}
		},
		delivery: {
			type: 'object',
			description: 'Ship-to details for fulfilment',
			properties: {
				name: { type: 'string', description: 'Ship-to name' },
				address: {
					type: 'object',
					description: 'Ship-to address',
					properties: {
						street: { type: 'string', description: 'Street address' },
						city: { type: 'string', description: 'City' },
						postalCode: { type: 'string', description: 'Postal code' },
						country: { type: 'string', description: 'Country code' }
					}
				}
			}
		},
		items: {
			type: 'array',
			description: 'Sales order line items',
			items: {
				type: 'object',
				required: ['position', 'sku', 'qty', 'price', 'amount'],
				properties: {
					position: { type: 'integer', description: 'Sales order line sequence number' },
					customerLine: { type: 'integer', description: 'Original customer PO line number' },
					sku: { type: 'string', description: 'Supplier SKU to fulfil' },
					name: { type: 'string', description: 'Item name or description' },
					qty: { type: 'number', description: 'Quantity accepted on the sales order' },
					price: { type: 'number', description: 'Sales unit price' },
					amount: { type: 'number', description: 'Extended line amount' },
					needByDates: {
						type: 'array',
						description: 'Requested delivery dates',
						items: { type: 'string', description: 'Requested delivery date' }
					},
					sourcePo: { type: 'string', description: 'Original customer purchase order number' }
				}
			}
		},
		totalAmount: { type: 'number', description: 'Total merchandise amount across all lines' }
	}
};
