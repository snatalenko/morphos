import type { MappingSchema } from '../../../src/MappingSchema.ts';

export const epcUri: MappingSchema = {
	type: 'string',
	description: 'EPCIS URI identifier such as an EPC URN or GS1 Digital Link URI'
};

export const epcisTime: MappingSchema = {
	type: 'string',
	description: 'EPCIS date-time value'
};

export const epcisVocabularyValue: MappingSchema = {
	type: 'string',
	description: 'EPCIS or CBV vocabulary value, expressed as a compact value or URI'
};

export const readPoint: MappingSchema = {
	type: 'object',
	description: 'Location where the EPCIS event was captured',
	required: ['id'],
	properties: {
		id: {
			type: 'string',
			description: 'Read point identifier, typically a GLN or SGLN URI'
		}
	}
};

export const bizLocation: MappingSchema = {
	type: 'object',
	description: 'Business location where the objects are considered to be after the event',
	required: ['id'],
	properties: {
		id: {
			type: 'string',
			description: 'Business location identifier, typically a GLN or SGLN URI'
		}
	}
};

export const quantityElement: MappingSchema = {
	type: 'object',
	description: 'EPCIS quantity element for class-level objects',
	required: ['epcClass'],
	properties: {
		epcClass: {
			type: 'string',
			description: 'EPC class URI identifying the class of trade item or asset'
		},
		quantity: {
			type: 'number',
			description: 'Quantity for the EPC class'
		},
		uom: {
			type: 'string',
			description: 'Unit of measure code'
		}
	}
};

export const bizTransaction: MappingSchema = {
	type: 'object',
	description: 'Business transaction referenced by the EPCIS event',
	required: ['bizTransaction'],
	properties: {
		type: {
			type: 'string',
			description: 'Business transaction type, such as purchase order, invoice, or despatch advice',
			enum: ['bol', 'cert', 'desadv', 'inv', 'pedigree', 'po', 'poc', 'prodorder', 'recadv', 'rma', 'testprd', 'testres', 'upevt']
		},
		bizTransaction: {
			type: 'string',
			description: 'Business transaction identifier URI'
		}
	}
};

export const source: MappingSchema = {
	type: 'object',
	description: 'Source owning, possessing, or location party for the event',
	required: ['type', 'source'],
	properties: {
		type: {
			type: 'string',
			description: 'Source type vocabulary value',
			enum: ['owning_party', 'possessing_party', 'location']
		},
		source: {
			type: 'string',
			description: 'Source party or location identifier URI'
		}
	}
};

export const destination: MappingSchema = {
	type: 'object',
	description: 'Destination owning, possessing, or location party for the event',
	required: ['type', 'destination'],
	properties: {
		type: {
			type: 'string',
			description: 'Destination type vocabulary value',
			enum: ['owning_party', 'possessing_party', 'location']
		},
		destination: {
			type: 'string',
			description: 'Destination party or location identifier URI'
		}
	}
};

export const sensorElement: MappingSchema = {
	type: 'object',
	description: 'Sensor data associated with an EPCIS event',
	required: ['sensorReport'],
	properties: {
		sensorMetadata: {
			type: 'object',
			description: 'Metadata describing the sensor capture interval or device',
			properties: {
				time: epcisTime,
				startTime: epcisTime,
				endTime: epcisTime,
				deviceID: epcUri,
				deviceMetadata: epcUri
			}
		},
		sensorReport: {
			type: 'array',
			description: 'Sensor measurements reported for the event',
			items: {
				type: 'object',
				properties: {
					type: epcisVocabularyValue,
					value: {
						type: 'number',
						description: 'Numeric sensor reading'
					},
					uom: {
						type: 'string',
						description: 'Unit of measure for the sensor reading'
					},
					component: {
						type: 'string',
						description: 'Measured component or attribute'
					},
					stringValue: {
						type: 'string',
						description: 'String sensor value'
					},
					booleanValue: {
						type: 'boolean',
						description: 'Boolean sensor value'
					},
					uriValue: epcUri,
					minValue: {
						type: 'number',
						description: 'Minimum measured value'
					},
					maxValue: {
						type: 'number',
						description: 'Maximum measured value'
					},
					meanValue: {
						type: 'number',
						description: 'Mean measured value'
					},
					sDev: {
						type: 'number',
						description: 'Standard deviation of measured values'
					},
					percRank: {
						type: 'number',
						description: 'Percentile rank for a percentile value'
					},
					percValue: {
						type: 'number',
						description: 'Percentile measured value'
					}
				}
			}
		}
	}
};

export const persistentDisposition: MappingSchema = {
	type: 'object',
	description: 'Persistent disposition values set or unset by this event',
	properties: {
		set: {
			type: 'array',
			description: 'Disposition values set by the event',
			items: epcisVocabularyValue
		},
		unset: {
			type: 'array',
			description: 'Disposition values unset by the event',
			items: epcisVocabularyValue
		}
	}
};

export const errorDeclaration: MappingSchema = {
	type: 'object',
	description: 'Declaration that this EPCIS event is erroneous or corrected',
	required: ['declarationTime'],
	properties: {
		declarationTime: epcisTime,
		reason: {
			type: 'string',
			description: 'Reason the event is declared erroneous',
			enum: ['did_not_occur', 'incorrect_data']
		},
		correctiveEventIDs: {
			type: 'array',
			description: 'Identifiers of corrective EPCIS events',
			items: {
				type: 'string',
				description: 'Corrective event identifier'
			}
		}
	}
};

export const ilmd: MappingSchema = {
	type: 'object',
	description: 'Instance or lot master data associated with this event'
};

export function epcList(description: string): MappingSchema {
	return {
		type: 'array',
		description,
		items: epcUri
	};
}

export function quantityList(description: string): MappingSchema {
	return {
		type: 'array',
		description,
		items: quantityElement
	};
}

export function commonEventProperties(): NonNullable<MappingSchema['properties']> {
	return {
		'@context': {
			type: ['string', 'array', 'object'],
			description: 'JSON-LD context for EPCIS data'
		},
		eventTime: {
			type: 'string',
			description: 'Date and time when the EPCIS event occurred'
		},
		recordTime: {
			type: 'string',
			description: 'Date and time when the EPCIS event was recorded'
		},
		eventTimeZoneOffset: {
			type: 'string',
			description: 'Time zone offset in effect at the event time, such as +00:00'
		},
		eventID: {
			type: 'string',
			description: 'Unique EPCIS event identifier'
		},
		certificationInfo: {
			type: 'string',
			description: 'Certification information associated with the event'
		},
		errorDeclaration
	};
}

export function commonWhyWhereHowProperties(): NonNullable<MappingSchema['properties']> {
	return {
		bizStep: {
			type: 'string',
			description: 'Business step vocabulary value, such as shipping, receiving, or commissioning',
			enum: [
				'accepting', 'arriving', 'assembling', 'collecting', 'commissioning', 'conforming',
				'creating_class_instance', 'cycle_counting', 'decommissioning', 'departing', 'destroying',
				'disassembling', 'dispensing', 'encoding', 'entering_exiting', 'grading', 'harvesting',
				'holding', 'inspecting', 'installing', 'killing', 'loading', 'other', 'packing', 'picking',
				'producing', 'receiving', 'relocating', 'removing', 'repackaging', 'reserving',
				'retail_selling', 'sampling', 'sensor_reporting', 'shipping', 'staging_outbound',
				'stock_taking', 'stocking', 'storing', 'transforming', 'transporting', 'unloading',
				'unpacking', 'void_shipping'
			]
		},
		disposition: {
			type: 'string',
			description: 'Business disposition vocabulary value, such as in_transit or active',
			enum: [
				'active', 'available', 'completeness_inferred', 'completeness_verified', 'conformant',
				'container_closed', 'container_open', 'damaged', 'destroyed', 'dispensed', 'disposed',
				'encoded', 'expired', 'in_progress', 'in_transit', 'inactive', 'mismatch_class',
				'mismatch_instance', 'mismatch_quantity', 'needs_replacement', 'no_pedigree_match',
				'non_conformant', 'not_dispensed', 'partially_dispensed', 'recalled', 'rejected',
				'reserved', 'retail_sold', 'returned', 'sellable_accessible', 'sellable_not_accessible',
				'stolen', 'unknown'
			]
		},
		persistentDisposition,
		readPoint,
		bizLocation,
		bizTransactionList: {
			type: 'array',
			description: 'Business transactions associated with the event',
			items: bizTransaction
		},
		sourceList: {
			type: 'array',
			description: 'Source parties or locations for the event',
			items: source
		},
		destinationList: {
			type: 'array',
			description: 'Destination parties or locations for the event',
			items: destination
		},
		sensorElementList: {
			type: 'array',
			description: 'Sensor elements associated with the event',
			items: sensorElement
		}
	};
}
