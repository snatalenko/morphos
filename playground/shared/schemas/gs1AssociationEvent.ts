import type { DocumentSchemaSample } from './types.ts';
import {
	commonEventProperties,
	commonWhyWhereHowProperties,
	epcList,
	epcUri,
	quantityList
} from './gs1EpcisCommon.ts';

export const gs1AssociationEvent: DocumentSchemaSample = {
	id: 'gs1-epcis-association-event',
	label: 'GS1 EPCIS - AssociationEvent',
	documentType: 'GS1 EPCIS Event',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'GS1 EPCIS AssociationEvent',
		description: 'EPCIS event for associating child objects with a parent without physical aggregation semantics.',
		required: ['type', 'eventTime', 'eventTimeZoneOffset', 'action', 'parentID'],
		properties: {
			...commonEventProperties(),
			type: {
				type: 'string',
				description: 'Constant event type value: AssociationEvent'
			},
			parentID: {
				...epcUri,
				description: 'Parent EPC identifier for the association'
			},
			childEPCs: epcList('Child EPC instance identifiers associated with the parent'),
			childQuantityList: quantityList('Class-level child quantities associated with the parent'),
			action: {
				type: 'string',
				description: 'Association event action: ADD, OBSERVE, or DELETE'
			},
			...commonWhyWhereHowProperties()
		}
	}
};
