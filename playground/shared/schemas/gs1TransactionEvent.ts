import type { DocumentSchemaSample } from './types.ts';
import {
	bizTransaction,
	commonEventProperties,
	commonWhyWhereHowProperties,
	epcList,
	epcUri,
	quantityList
} from './gs1EpcisCommon.ts';

export const gs1TransactionEvent: DocumentSchemaSample = {
	id: 'gs1-epcis-transaction-event',
	label: 'GS1 EPCIS - TransactionEvent',
	documentType: 'GS1 EPCIS Event',
	complexity: 'Complex',
	schema: {
		type: 'object',
		title: 'GS1 EPCIS TransactionEvent',
		description: 'EPCIS event associating or disassociating objects with business transactions.',
		required: ['type', 'eventTime', 'eventTimeZoneOffset', 'bizTransactionList', 'action'],
		properties: {
			...commonEventProperties(),
			type: {
				type: 'string',
				description: 'Constant event type value: TransactionEvent',
				enum: ['TransactionEvent']
			},
			parentID: {
				...epcUri,
				description: 'Optional parent EPC identifier associated with the transaction'
			},
			epcList: epcList('EPC instance identifiers associated with the business transaction'),
			quantityList: quantityList('Class-level quantities associated with the business transaction'),
			action: {
				type: 'string',
				description: 'Transaction event action: ADD, OBSERVE, or DELETE',
				enum: ['ADD', 'OBSERVE', 'DELETE']
			},
			...commonWhyWhereHowProperties(),
			bizTransactionList: {
				type: 'array',
				description: 'Business transactions associated with the objects',
				items: bizTransaction
			}
		}
	}
};
