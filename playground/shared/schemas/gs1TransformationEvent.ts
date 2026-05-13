import type { DocumentSchemaSample } from './types.ts';
import {
	commonEventProperties,
	commonWhyWhereHowProperties,
	epcList,
	epcUri,
	ilmd,
	quantityList
} from './gs1EpcisCommon.ts';

export const gs1TransformationEvent: DocumentSchemaSample = {
	id: 'gs1-epcis-transformation-event',
	label: 'GS1 EPCIS - TransformationEvent',
	documentType: 'GS1 EPCIS Event',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'GS1 EPCIS TransformationEvent',
		description: 'EPCIS event for input objects or quantities transformed into output objects or quantities.',
		required: ['type', 'eventTime', 'eventTimeZoneOffset'],
		properties: {
			...commonEventProperties(),
			type: {
				type: 'string',
				description: 'Constant event type value: TransformationEvent',
				enum: ['TransformationEvent']
			},
			inputEPCList: epcList('Input EPC instance identifiers consumed or used by the transformation'),
			inputQuantityList: quantityList('Input class-level quantities consumed or used by the transformation'),
			outputEPCList: epcList('Output EPC instance identifiers produced by the transformation'),
			outputQuantityList: quantityList('Output class-level quantities produced by the transformation'),
			transformationID: {
				...epcUri,
				description: 'Identifier linking multiple related transformation events'
			},
			...commonWhyWhereHowProperties(),
			ilmd
		}
	}
};
