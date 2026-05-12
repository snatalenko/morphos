import type { DocumentSchemaSample } from './types.ts';

export const shipmentNoticeSimple: DocumentSchemaSample = {
	id: 'shipment-notice-simple',
	label: 'Shipment Notice - simple',
	documentType: 'Shipment Notice',
	complexity: 'Simple',
	schema: {
		type: 'object',
		title: 'Simple shipment notice',
		description: 'Flat advance shipment notice with shipment header, carrier, and shipped items.',
		required: ['shipmentNumber', 'shipDate', 'carrierName', 'items'],
		properties: {
			shipmentNumber: { type: 'string', description: 'Shipment notice or ASN number' },
			purchaseOrderNumber: { type: 'string', description: 'Purchase order associated with the shipment' },
			shipDate: { type: 'string', description: 'Date when goods shipped' },
			estimatedDeliveryDate: { type: 'string', description: 'Estimated delivery date at destination' },
			carrierName: { type: 'string', description: 'Carrier transporting the goods' },
			trackingNumber: { type: 'string', description: 'Carrier tracking or PRO number' },
			shipFromName: { type: 'string', description: 'Shipping origin name' },
			shipToName: { type: 'string', description: 'Receiving destination name' },
			items: {
				type: 'array',
				description: 'Shipped items',
				items: {
					type: 'object',
					required: ['lineNumber', 'itemCode', 'shippedQuantity'],
					properties: {
						lineNumber: { type: 'integer', description: 'Shipment line number' },
						purchaseOrderLineNumber: { type: 'string', description: 'Referenced purchase order line number' },
						itemCode: { type: 'string', description: 'Product or item code shipped' },
						description: { type: 'string', description: 'Item description' },
						shippedQuantity: { type: 'number', description: 'Quantity shipped' },
						unitOfMeasure: { type: 'string', description: 'Quantity unit of measure' }
					}
				}
			},
			totalShippedQuantity: { type: 'number', description: 'Total quantity shipped across all items' }
		}
	}
};

export const shipmentNoticeComplex: DocumentSchemaSample = {
	id: 'shipment-notice-complex',
	label: 'Shipment Notice - complex',
	documentType: 'Shipment Notice',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'Complex shipment notice',
		description: 'Nested ASN document with shipment header, logistics parties, packages, items, and references.',
		required: ['shipment', 'shipFrom', 'shipTo', 'packages'],
		properties: {
			shipment: {
				type: 'object',
				description: 'Shipment header and transport details',
				required: ['asnNumber', 'shipDate'],
				properties: {
					asnNumber: { type: 'string', description: 'Advance shipment notice number' },
					shipmentStatus: { type: 'string', description: 'Shipment status such as shipped or cancelled' },
					shipDate: { type: 'string', description: 'Date when shipment left origin' },
					estimatedArrivalDate: { type: 'string', description: 'Estimated arrival date at destination' },
					purchaseOrderNumber: { type: 'string', description: 'Purchase order associated with this shipment' },
					billOfLadingNumber: { type: 'string', description: 'Bill of lading number for freight shipment' },
					proNumber: { type: 'string', description: 'Carrier PRO tracking number' },
					mode: { type: 'string', description: 'Transportation mode such as parcel, LTL, or ocean' },
					carrierScac: { type: 'string', description: 'Carrier SCAC code' },
					carrierName: { type: 'string', description: 'Carrier name' }
				}
			},
			shipFrom: {
				type: 'object',
				description: 'Shipment origin location',
				properties: {
					locationId: { type: 'string', description: 'Origin location identifier' },
					name: { type: 'string', description: 'Origin location name' },
					addressLine1: { type: 'string', description: 'Origin street address' },
					city: { type: 'string', description: 'Origin city' },
					region: { type: 'string', description: 'Origin state or province' },
					postalCode: { type: 'string', description: 'Origin postal code' },
					countryCode: { type: 'string', description: 'Origin country code' }
				}
			},
			shipTo: {
				type: 'object',
				description: 'Shipment destination location',
				properties: {
					locationId: { type: 'string', description: 'Destination location identifier' },
					name: { type: 'string', description: 'Destination location name' },
					addressLine1: { type: 'string', description: 'Destination street address' },
					city: { type: 'string', description: 'Destination city' },
					region: { type: 'string', description: 'Destination state or province' },
					postalCode: { type: 'string', description: 'Destination postal code' },
					countryCode: { type: 'string', description: 'Destination country code' }
				}
			},
			packages: {
				type: 'array',
				description: 'Physical handling units in the shipment',
				items: {
					type: 'object',
					required: ['packageId'],
					properties: {
						packageId: { type: 'string', description: 'Package, carton, pallet, or SSCC identifier' },
						parentPackageId: { type: 'string', description: 'Parent package identifier for nested packs' },
						packageType: { type: 'string', description: 'Handling unit type such as carton or pallet' },
						trackingNumber: { type: 'string', description: 'Package-level carrier tracking number' },
						weight: { type: 'number', description: 'Package gross weight' },
						weightUnit: { type: 'string', description: 'Weight unit of measure' },
						dimensions: {
							type: 'object',
							description: 'Package dimensions',
							properties: {
								length: { type: 'number', description: 'Package length' },
								width: { type: 'number', description: 'Package width' },
								height: { type: 'number', description: 'Package height' },
								unit: { type: 'string', description: 'Dimension unit of measure' }
							}
						},
						contents: {
							type: 'array',
							description: 'Items packed in this handling unit',
							items: {
								type: 'object',
								required: ['itemCode', 'shippedQuantity'],
								properties: {
									purchaseOrderLineNumber: {
										type: 'string',
										description: 'Referenced purchase order line number'
									},
									itemCode: { type: 'string', description: 'Product or item code packed' },
									lotNumber: { type: 'string', description: 'Manufacturing lot number' },
									serialNumber: { type: 'string', description: 'Serial number for serialized goods' },
									shippedQuantity: { type: 'number', description: 'Quantity shipped in this package' },
									unitOfMeasure: { type: 'string', description: 'Quantity unit of measure' }
								}
							}
						}
					}
				}
			},
			summary: {
				type: 'object',
				description: 'Shipment summary totals',
				properties: {
					totalPackages: { type: 'integer', description: 'Total number of physical packages' },
					totalItems: { type: 'integer', description: 'Total number of item content records' },
					totalShippedQuantity: { type: 'number', description: 'Total quantity shipped across all packages' },
					totalWeight: { type: 'number', description: 'Total gross shipment weight' }
				}
			}
		}
	}
};

export const shipmentNoticeSamples = [
	shipmentNoticeSimple,
	shipmentNoticeComplex
];
