import type { DocumentSchemaSample } from './types.ts';
import {
	commonEventProperties,
	commonWhyWhereHowProperties,
	epcList,
	ilmd,
	quantityList
} from './gs1EpcisCommon.ts';

export const gs1ObjectEvent: DocumentSchemaSample = {
	id: 'gs1-epcis-object-event',
	label: 'GS1 EPCIS - ObjectEvent',
	documentType: 'GS1 EPCIS Event',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'GS1 EPCIS ObjectEvent',
		description: 'EPCIS event for something happening to one or more physical or digital objects.',
		required: ['type', 'eventTime', 'eventTimeZoneOffset', 'action'],
		properties: {
			...commonEventProperties(),
			type: {
				type: 'string',
				description: 'Constant event type value: ObjectEvent'
			},
			epcList: epcList('List of EPC instance identifiers involved in the event'),
			quantityList: quantityList('Class-level quantities involved in the event'),
			action: {
				type: 'string',
				description: 'Object event action: ADD, OBSERVE, or DELETE'
			},
			...commonWhyWhereHowProperties(),
			ilmd
		}
	}
};
