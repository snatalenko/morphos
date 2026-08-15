import { expect } from 'chai';
import { getTupleItemSchema } from '../../src/react/utils/schemaProps.ts';

describe('getTupleItemSchema', () => {
	it('returns tuple item schemas or homogeneous item fallback schemas', () => {
		const itemSchema = { type: 'string' } as const;
		const tupleItemSchema = { type: 'number' } as const;

		expect(getTupleItemSchema(undefined, 0)).to.equal(undefined);
		expect(getTupleItemSchema({ type: 'array', items: itemSchema }, 2)).to.equal(itemSchema);
		expect(getTupleItemSchema({ type: 'array', items: [tupleItemSchema, true] }, 0)).to.equal(tupleItemSchema);
		expect(getTupleItemSchema({ type: 'array', items: [tupleItemSchema, true] }, 1)).to.equal(undefined);
		expect(getTupleItemSchema({ type: 'array', items: [tupleItemSchema] }, 2)).to.equal(undefined);
	});

	it('uses homogeneous array item schemas for tuple editor items', () => {
		const itemSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				quantity: { type: 'number' }
			}
		} as const;

		expect(getTupleItemSchema({
			type: 'array',
			items: itemSchema
		}, 0)).to.equal(itemSchema);
		expect(getTupleItemSchema({
			type: 'array',
			items: itemSchema
		}, 1)).to.equal(itemSchema);
	});
});
