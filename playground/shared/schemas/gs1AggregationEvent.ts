import type { DocumentSchemaSample } from './types.ts';
import {
	commonEventProperties,
	commonWhyWhereHowProperties,
	epcList,
	epcUri,
	quantityList
} from './gs1EpcisCommon.ts';

export const gs1AggregationEvent: DocumentSchemaSample = {
	id: 'gs1-epcis-aggregation-event',
	label: 'GS1 EPCIS - AggregationEvent',
	documentType: 'GS1 EPCIS Event',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'GS1 EPCIS AggregationEvent',
		description: 'EPCIS event for objects physically aggregated into or removed from a parent object.',
		required: ['type', 'eventTime', 'eventTimeZoneOffset', 'action'],
		properties: {
			...commonEventProperties(),
			type: {
				type: 'string',
				description: 'Constant event type value: AggregationEvent',
				enum: ['AggregationEvent']
			},
			parentID: {
				...epcUri,
				description: 'Parent EPC identifier for the aggregation, such as a pallet or case SSCC'
			},
			childEPCs: epcList('Child EPC instance identifiers in the aggregation'),
			childQuantityList: quantityList('Class-level child quantities in the aggregation'),
			action: {
				type: 'string',
				description: 'Aggregation event action: ADD, OBSERVE, or DELETE',
				enum: ['ADD', 'OBSERVE', 'DELETE']
			},
			...commonWhyWhereHowProperties()
		}
	}
};
