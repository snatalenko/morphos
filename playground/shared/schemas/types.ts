import type { JsonSchema } from '../../../src/JsonSchema.ts';

export type DocumentSchemaSample = {
	id: string;
	label: string;
	documentType: 'Purchase Order' | 'Invoice' | 'Shipment Notice' | 'GS1 EPCIS Event';
	complexity: 'Simple' | 'Complex';
	schema: JsonSchema;
};
