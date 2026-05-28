import { gs1AggregationEvent } from './gs1AggregationEvent.ts';
import { gs1AssociationEvent } from './gs1AssociationEvent.ts';
import { gs1ObjectEvent } from './gs1ObjectEvent.ts';
import { gs1TransactionEvent } from './gs1TransactionEvent.ts';
import { gs1TransformationEvent } from './gs1TransformationEvent.ts';
import { invoiceSamples } from './invoice.ts';
import { purchaseOrderSamples } from './purchaseOrder.ts';
import { shipmentNoticeSamples } from './shipmentNotice.ts';
import type { DocumentSchemaSample } from './types.ts';

export type { DocumentSchemaSample } from './types.ts';

export const documentSchemaSamples: DocumentSchemaSample[] = [
	...purchaseOrderSamples,
	...invoiceSamples,
	...shipmentNoticeSamples,
	gs1ObjectEvent,
	gs1AggregationEvent,
	gs1TransformationEvent,
	gs1TransactionEvent,
	gs1AssociationEvent
];
