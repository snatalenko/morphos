import { sampleForSchema } from '../../src';
import { sampleForSchema as sampleForSchemaFromUtils } from '../../src/utils/index.ts';
import type { JSONSchema4 } from 'json-schema';
import * as sampleSchema from './data/sampleSchema.json';
import { gs1ObjectEvent } from '../../playground/shared/schemas/gs1ObjectEvent.ts';
import { expect } from 'chai';

function clone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

describe('sampleForSchema', () => {

	it('generates sample data for JSON schema', () => {

		const sample = sampleForSchema(sampleSchema as JSONSchema4);

		expect(sample).to.eql({
			id: '00000000000000000000000000000000',
			longText: 'texttextte',
			shortText: 'te',
			textWithExample: 'example 1',
			textWithDefault: 'example 2',
			bool: true,
			null: null,
			numWithMax: 199.99,
			numWithMin: 100.01,
			number: 1,
			int: 101,
			array: [
				{
					type: 'work'
				}
			],
			stringArray: [
				'text',
				'text'
			],
			tupleArray: [
				'text',
				1,
				{
					foo: 'bar'
				}
			],
			complexObject: {
				foo: 'bar',
				baz: true
			},
			oneChoice: 'text',
			multiChoice: 'text',
			withAdditionalProps: {
				additionalProp1: 'text'
			}
		});
	});

	it('throws TypeError when type is not described', () => {

		const brokenSchema0 = clone(sampleSchema);
		delete (brokenSchema0.properties.longText as any).type;

		expect(() => {
			sampleForSchema(brokenSchema0 as JSONSchema4);
		}).to.throw(TypeError);
	});

	it('does not throw Error when items are not described', () => {

		const brokenSchema1 = clone(sampleSchema);
		delete (brokenSchema1.properties.array as any).items;

		expect(() => {
			sampleForSchema(brokenSchema1 as JSONSchema4);
		}).to.not.throw(TypeError);

		const brokenSchema2 = clone(sampleSchema);
		delete (brokenSchema2.properties.array.items as any).properties;

		expect(() => {
			sampleForSchema(brokenSchema2 as JSONSchema4);
		}).to.not.throw(TypeError);
	});

	it('uses maximum when exclusiveMaximum is not set', () => {

		const sample = sampleForSchema({
			type: 'number',
			maximum: 10
		} as JSONSchema4);

		expect(sample).to.eql(10);
	});

	it('uses the first non-null type for schema type arrays', () => {
		expect(sampleForSchema({
			type: ['null', 'object'],
			properties: {
				id: { type: 'string' }
			}
		} as JSONSchema4)).to.eql({ id: 'text' });

		expect(sampleForSchema({
			type: ['string', 'array', 'object']
		} as JSONSchema4)).to.equal('text');
	});

	it('generates sample data for GS1 event schemas', () => {
		const sample = sampleForSchema(gs1ObjectEvent.schema as unknown as JSONSchema4);

		expect(sample).to.have.property('@context', 'text');
		expect(sample).to.have.property('type');
	});

	it('is exported from utils', () => {
		expect(sampleForSchemaFromUtils({ type: 'string' } as JSONSchema4)).to.equal('text');
	});
});
