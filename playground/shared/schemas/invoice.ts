import type { DocumentSchemaSample } from './types.ts';

export const invoiceSimple: DocumentSchemaSample = {
	id: 'invoice-simple',
	label: 'Invoice - simple',
	documentType: 'Invoice',
	complexity: 'Simple',
	schema: {
		type: 'object',
		title: 'Simple invoice',
		description: 'Flat supplier invoice with one buyer, invoice header, and invoice lines.',
		required: ['invoiceNumber', 'invoiceDate', 'supplierName', 'lines'],
		properties: {
			invoiceNumber: { type: 'string', description: 'Invoice number assigned by the supplier' },
			invoiceDate: { type: 'string', description: 'Date when the invoice was issued' },
			purchaseOrderNumber: { type: 'string', description: 'Buyer purchase order referenced by the invoice' },
			supplierName: { type: 'string', description: 'Supplier issuing the invoice' },
			buyerName: { type: 'string', description: 'Customer or buyer receiving the invoice' },
			currency: { type: 'string', description: 'Invoice currency code' },
			lines: {
				type: 'array',
				description: 'Invoice line items',
				items: {
					type: 'object',
					required: ['lineNumber', 'itemCode', 'quantity', 'unitPrice'],
					properties: {
						lineNumber: { type: 'integer', description: 'Invoice line number' },
						itemCode: { type: 'string', description: 'Product or service code being invoiced' },
						description: { type: 'string', description: 'Line description' },
						quantity: { type: 'number', description: 'Invoiced quantity' },
						unitPrice: { type: 'number', description: 'Price per invoiced unit' },
						lineAmount: { type: 'number', description: 'Extended invoice line amount' }
					}
				}
			},
			subtotalAmount: { type: 'number', description: 'Sum of invoice line amounts before tax' },
			taxAmount: { type: 'number', description: 'Total invoice tax amount' },
			totalAmount: { type: 'number', description: 'Total amount due on the invoice' }
		}
	}
};

export const invoiceComplex: DocumentSchemaSample = {
	id: 'invoice-complex',
	label: 'Invoice - complex',
	documentType: 'Invoice',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'Complex invoice',
		description: 'Nested accounts payable invoice with header, parties, addresses, taxes, allowances, and totals.',
		required: ['header', 'seller', 'buyer', 'invoiceLines'],
		properties: {
			header: {
				type: 'object',
				description: 'Invoice header information',
				required: ['invoiceNumber', 'invoiceDate'],
				properties: {
					invoiceNumber: { type: 'string', description: 'Invoice number assigned by the seller' },
					invoiceType: { type: 'string', description: 'Invoice type such as invoice, credit memo, or debit memo' },
					invoiceDate: { type: 'string', description: 'Date when the invoice was issued' },
					dueDate: { type: 'string', description: 'Payment due date' },
					purchaseOrderNumber: { type: 'string', description: 'Purchase order referenced by the invoice' },
					contractNumber: { type: 'string', description: 'Related customer contract number' },
					currencyCode: { type: 'string', description: 'Invoice currency code' },
					paymentTerms: { type: 'string', description: 'Payment terms text or code' }
				}
			},
			seller: {
				type: 'object',
				description: 'Supplier or seller issuing the invoice',
				properties: {
					id: { type: 'string', description: 'Supplier trading partner identifier' },
					name: { type: 'string', description: 'Supplier legal name' },
					taxRegistrationNumber: { type: 'string', description: 'Supplier VAT or tax identifier' },
					remitToAccount: { type: 'string', description: 'Remittance account or supplier bank reference' },
					address: {
						type: 'object',
						description: 'Supplier address',
						properties: {
							line1: { type: 'string', description: 'Supplier street address' },
							city: { type: 'string', description: 'Supplier city' },
							state: { type: 'string', description: 'Supplier state or province' },
							postalCode: { type: 'string', description: 'Supplier postal code' },
							countryCode: { type: 'string', description: 'Supplier country code' }
						}
					}
				}
			},
			buyer: {
				type: 'object',
				description: 'Customer or buyer receiving the invoice',
				properties: {
					id: { type: 'string', description: 'Buyer trading partner identifier' },
					name: { type: 'string', description: 'Buyer legal name' },
					accountNumber: { type: 'string', description: 'Customer account number assigned by supplier' },
					billToAddress: {
						type: 'object',
						description: 'Billing address for the buyer',
						properties: {
							line1: { type: 'string', description: 'Billing street address' },
							city: { type: 'string', description: 'Billing city' },
							state: { type: 'string', description: 'Billing state or province' },
							postalCode: { type: 'string', description: 'Billing postal code' },
							countryCode: { type: 'string', description: 'Billing country code' }
						}
					}
				}
			},
			invoiceLines: {
				type: 'array',
				description: 'Goods or services being invoiced',
				items: {
					type: 'object',
					required: ['lineNumber', 'quantity', 'unitPrice'],
					properties: {
						lineNumber: { type: 'integer', description: 'Invoice line sequence number' },
						purchaseOrderLineNumber: { type: 'string', description: 'Referenced purchase order line number' },
						product: {
							type: 'object',
							description: 'Product or service identifiers',
							properties: {
								sku: { type: 'string', description: 'Supplier product code' },
								buyerItemNumber: { type: 'string', description: 'Buyer item number' },
								upc: { type: 'string', description: 'Consumer product UPC for this line item' },
								description: { type: 'string', description: 'Item description' }
							}
						},
						quantity: { type: 'number', description: 'Quantity invoiced' },
						unitOfMeasure: { type: 'string', description: 'Quantity unit of measure' },
						unitPrice: { type: 'number', description: 'Unit price charged' },
						grossAmount: { type: 'number', description: 'Quantity multiplied by unit price before allowances' },
						allowances: {
							type: 'array',
							description: 'Line-level discounts, rebates, or allowances',
							items: {
								type: 'object',
								properties: {
									reasonCode: { type: 'string', description: 'Allowance reason code' },
									amount: { type: 'number', description: 'Allowance amount' }
								}
							}
						},
						taxes: {
							type: 'array',
							description: 'Line-level taxes',
							items: {
								type: 'object',
								properties: {
									taxType: { type: 'string', description: 'Tax type or jurisdiction code' },
									taxRate: { type: 'number', description: 'Tax rate percentage' },
									taxAmount: { type: 'number', description: 'Tax amount for this line' }
								}
							}
						},
						netAmount: { type: 'number', description: 'Line amount after allowances before header charges' }
					}
				}
			},
			totals: {
				type: 'object',
				description: 'Invoice monetary totals',
				properties: {
					lineSubtotal: { type: 'number', description: 'Sum of gross line amounts' },
					allowanceTotal: { type: 'number', description: 'Sum of line and header allowances' },
					taxTotal: { type: 'number', description: 'Total invoice tax amount' },
					shippingAmount: { type: 'number', description: 'Freight or shipping amount charged on invoice' },
					amountDue: { type: 'number', description: 'Total invoice amount due for payment' }
				}
			}
		}
	}
};

export const invoiceSamples = [
	invoiceSimple,
	invoiceComplex
];
