import type { DocumentSchemaSample } from './types.ts';

export const purchaseOrderSimple: DocumentSchemaSample = {
	id: 'purchase-order-simple',
	label: 'Purchase Order - simple',
	documentType: 'Purchase Order',
	complexity: 'Simple',
	schema: {
		type: 'object',
		title: 'Simple purchase order',
		description: 'Flat purchase order document with buyer, supplier, and item lines.',
		required: ['poNumber', 'orderDate', 'supplierCode', 'items'],
		properties: {
			poNumber: { type: 'string', description: 'Purchase order number assigned by the buyer' },
			orderDate: { type: 'string', description: 'Purchase order date in ISO format' },
			buyerName: { type: 'string', description: 'Name of the buying company' },
			supplierCode: { type: 'string', description: 'Supplier or vendor account code' },
			currency: { type: 'string', description: 'Order currency code' },
			items: {
				type: 'array',
				description: 'Purchased goods or services',
				items: {
					type: 'object',
					required: ['lineNumber', 'sku', 'quantity', 'unitPrice'],
					properties: {
						lineNumber: { type: 'integer', description: 'Purchase order line number' },
						sku: { type: 'string', description: 'Buyer item or product code' },
						description: { type: 'string', description: 'Item description' },
						quantity: { type: 'number', description: 'Ordered quantity' },
						unitPrice: { type: 'number', description: 'Agreed unit purchase price' },
						requestedDeliveryDate: { type: 'string', description: 'Requested delivery date for this line' }
					}
				}
			},
			totalAmount: { type: 'number', description: 'Total ordered amount for all lines' }
		}
	}
};

export const purchaseOrderComplex: DocumentSchemaSample = {
	id: 'purchase-order-complex',
	label: 'Purchase Order - complex',
	documentType: 'Purchase Order',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'Complex purchase order',
		description: 'Nested ERP purchase order with parties, addresses, line schedules, charges, and totals.',
		required: ['header', 'parties', 'lines'],
		properties: {
			header: {
				type: 'object',
				description: 'Purchase order header information',
				required: ['orderNumber', 'orderDate'],
				properties: {
					orderNumber: { type: 'string', description: 'Purchase order number assigned by the buyer' },
					revision: { type: 'string', description: 'Purchase order revision or change number' },
					orderDate: { type: 'string', description: 'Date when the purchase order was issued' },
					requestedShipDate: { type: 'string', description: 'Requested ship date for the order' },
					currencyCode: { type: 'string', description: 'Transaction currency code' },
					buyerReference: { type: 'string', description: 'Buyer internal reference or requisition number' },
					paymentTerms: { type: 'string', description: 'Payment terms for the order' },
					incoterm: { type: 'string', description: 'Delivery terms such as FOB or DDP' }
				}
			},
			parties: {
				type: 'object',
				description: 'Organizations involved in the purchase order',
				properties: {
					buyer: {
						type: 'object',
						description: 'Buying organization',
						properties: {
							id: { type: 'string', description: 'Buyer trading partner identifier' },
							name: { type: 'string', description: 'Buyer legal name' },
							taxId: { type: 'string', description: 'Buyer tax registration identifier' },
							contactEmail: { type: 'string', description: 'Buyer contact email' }
						}
					},
					supplier: {
						type: 'object',
						description: 'Supplier or vendor organization',
						properties: {
							id: { type: 'string', description: 'Supplier trading partner identifier' },
							name: { type: 'string', description: 'Supplier legal name' },
							accountNumber: { type: 'string', description: 'Vendor account number used by buyer' }
						}
					},
					shipTo: {
						type: 'object',
						description: 'Ship-to location',
						properties: {
							name: { type: 'string', description: 'Receiving location name' },
							addressLine1: { type: 'string', description: 'Ship-to street address' },
							city: { type: 'string', description: 'Ship-to city' },
							region: { type: 'string', description: 'Ship-to state or province' },
							postalCode: { type: 'string', description: 'Ship-to postal code' },
							country: { type: 'string', description: 'Ship-to country code' }
						}
					}
				}
			},
			lines: {
				type: 'array',
				description: 'Purchase order line items',
				items: {
					type: 'object',
					required: ['lineNumber', 'item', 'orderedQuantity'],
					properties: {
						lineNumber: { type: 'integer', description: 'Line sequence number' },
						item: {
							type: 'object',
							description: 'Ordered item identifiers',
							properties: {
								buyerPartNumber: { type: 'string', description: 'Buyer item number' },
								supplierPartNumber: { type: 'string', description: 'Supplier item number' },
								upc: { type: 'string', description: 'Consumer product UPC for the item' },
								description: { type: 'string', description: 'Item description' }
							}
						},
						orderedQuantity: { type: 'number', description: 'Quantity ordered' },
						unitOfMeasure: { type: 'string', description: 'Quantity unit of measure' },
						unitPrice: { type: 'number', description: 'Unit purchase price' },
						lineAmount: { type: 'number', description: 'Extended line amount' },
						deliverySchedules: {
							type: 'array',
							description: 'Requested deliveries for this line',
							items: {
								type: 'object',
								properties: {
									shipDate: { type: 'string', description: 'Requested shipment date' },
									deliveryDate: { type: 'string', description: 'Requested delivery date' },
									quantity: { type: 'number', description: 'Scheduled quantity' }
								}
							}
						}
					}
				}
			},
			charges: {
				type: 'array',
				description: 'Header-level freight, handling, or miscellaneous charges',
				items: {
					type: 'object',
					properties: {
						type: { type: 'string', description: 'Charge type code' },
						description: { type: 'string', description: 'Charge description' },
						amount: { type: 'number', description: 'Charge amount' }
					}
				}
			},
			totals: {
				type: 'object',
				description: 'Purchase order monetary totals',
				properties: {
					lineTotal: { type: 'number', description: 'Sum of line amounts' },
					chargeTotal: { type: 'number', description: 'Sum of header charges' },
					orderTotal: { type: 'number', description: 'Total purchase order amount' }
				}
			}
		}
	}
};

export const purchaseOrderSamples = [
	purchaseOrderSimple,
	purchaseOrderComplex
];
