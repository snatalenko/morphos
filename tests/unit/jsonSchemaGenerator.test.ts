import {
	createJsonSchemaGenerator,
	type JsonSchemaGeneratorOptions
} from '../../src/index.ts';
import { createJsonSchemaGenerator as createJsonSchemaGeneratorFromUtils } from '../../src/utils/index.ts';
import { expect } from 'chai';

describe('jsonSchemaGenerator', () => {

	it('generates schemas for scalar samples', () => {
		expect(createJsonSchemaGenerator(null).toJsonSchema()).to.eql({ type: 'null' });
		expect(createJsonSchemaGenerator(true).toJsonSchema()).to.eql({ type: 'boolean' });
		expect(createJsonSchemaGenerator('text').toJsonSchema()).to.eql({ type: 'string' });
		expect(createJsonSchemaGenerator(1).toJsonSchema()).to.eql({ type: 'integer' });
		expect(createJsonSchemaGenerator(1.5).toJsonSchema()).to.eql({ type: 'number' });
	});

	it('generates object schemas with required fields present in every sample', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				{ id: 1, name: 'Alice' },
				{ id: 2 }
			])
			.toJsonSchema();

		expect(schema).to.eql({
			type: 'object',
			properties: {
				id: { type: 'integer' },
				name: { type: 'string' }
			},
			required: ['id']
		});
	});

	it('collapses integer and number variations and keeps nullable fields nullable', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				{ value: 1 },
				{ value: 2.5 },
				{ value: null }
			])
			.toJsonSchema();

		expect(schema).to.eql({
			type: 'object',
			properties: {
				value: { type: ['number', 'null'] }
			},
			required: ['value']
		});
	});

	it('merges mostly matching objects and emits oneOf for incompatible objects by default', () => {
		const matchingSchema = createJsonSchemaGenerator()
			.addSamples([
				{ id: 1, type: 'customer', name: 'Alice' },
				{ id: 2, type: 'customer', email: 'bob@example.com' }
			])
			.toJsonSchema();

		expect(matchingSchema).to.eql({
			type: 'object',
			properties: {
				id: { type: 'integer' },
				type: { type: 'string' },
				name: { type: 'string' },
				email: { type: 'string', format: 'email' }
			},
			required: ['id', 'type']
		});

		const incompatibleSchema = createJsonSchemaGenerator()
			.addSamples([
				{ kind: 'payment', amount: 10 },
				{ email: 'customer@example.com' }
			])
			.toJsonSchema();

		expect(incompatibleSchema).to.eql({
			oneOf: [
				{
					type: 'object',
					properties: {
						kind: { type: 'string' },
						amount: { type: 'integer' }
					},
					required: ['kind', 'amount']
				},
				{
					type: 'object',
					properties: {
						email: { type: 'string', format: 'email' }
					},
					required: ['email']
				}
			]
		});
	});

	it('can emit anyOf for incompatible samples', () => {
		const options: JsonSchemaGeneratorOptions = { unionKeyword: 'anyOf' };
		const inferred = createJsonSchemaGenerator({ a: 1 }, options)
			.addSample({ b: true })
			.toJsonSchema();

		expect(inferred).to.eql({
			anyOf: [
				{
					type: 'object',
					properties: {
						a: { type: 'integer' }
					},
					required: ['a']
				},
				{
					type: 'object',
					properties: {
						b: { type: 'boolean' }
					},
					required: ['b']
				}
			]
		});
	});

	it('emits nullable object schemas for null and object samples', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				null,
				{ id: 1 }
			])
			.toJsonSchema();

		expect(schema).to.eql({
			type: ['object', 'null'],
			properties: {
				id: { type: 'integer' }
			},
			required: ['id']
		});
	});

	it('emits oneOf for string and object samples', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				'text',
				{ id: 1 }
			])
			.toJsonSchema();

		expect(schema).to.eql({
			oneOf: [
				{ type: 'string' },
				{
					type: 'object',
					properties: {
						id: { type: 'integer' }
					},
					required: ['id']
				}
			]
		});
	});

	it('emits oneOf for null, string, and object samples', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				null,
				'text',
				{ id: 1 }
			])
			.toJsonSchema();

		expect(schema).to.eql({
			oneOf: [
				{ type: 'string' },
				{
					type: 'object',
					properties: {
						id: { type: 'integer' }
					},
					required: ['id']
				},
				{ type: 'null' }
			]
		});
	});

	it('generates array schemas and treats addSamples arrays as sample sets', () => {
		const arraySchema = createJsonSchemaGenerator([
			{ id: 1 },
			{ id: 2, name: 'Alice' }
		]).toJsonSchema();

		expect(arraySchema).to.eql({
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'integer' },
					name: { type: 'string' }
				},
				required: ['id']
			}
		});

		const sampleSetSchema = createJsonSchemaGenerator()
			.addSamples([
				{ id: 1 },
				{ id: 2, name: 'Alice' }
			])
			.toJsonSchema();

		expect(sampleSetSchema).to.eql(arraySchema.items);
	});

	it('infers conservative enums and does not overfit repeated high-cardinality strings', () => {
		const enumSchema = createJsonSchemaGenerator()
			.addSamples([
				{ status: 'new' },
				{ status: 'new' },
				{ status: 'done' },
				{ status: 'new' }
			])
			.toJsonSchema();

		expect(enumSchema).to.eql({
			type: 'object',
			properties: {
				status: {
					type: 'string',
					enum: ['new', 'done']
				}
			},
			required: ['status']
		});

		const repeatedIdSchema = createJsonSchemaGenerator()
			.addSamples([
				{ id: 'A-1' },
				{ id: 'A-2' },
				{ id: 'A-1' }
			])
			.toJsonSchema();

		expect(repeatedIdSchema).to.eql({
			type: 'object',
			properties: {
				id: { type: 'string' }
			},
			required: ['id']
		});

		const highCardinalitySchema = createJsonSchemaGenerator()
			.addSamples([
				{ value: 'A' },
				{ value: 'B' },
				{ value: 'C' },
				{ value: 'D' },
				{ value: 'E' },
				{ value: 'F' },
				{ value: 'G' },
				{ value: 'H' },
				{ value: 'I' },
				{ value: 'J' },
				{ value: 'K' },
				{ value: 'A' },
				{ value: 'A' }
			])
			.toJsonSchema();

		expect(highCardinalitySchema).to.eql({
			type: 'object',
			properties: {
				value: { type: 'string' }
			},
			required: ['value']
		});
	});

	it('detects common string formats', () => {
		const schema = createJsonSchemaGenerator({
			at: '2024-01-01T12:30:45Z',
			date: '2024-01-01',
			time: '12:30:45',
			email: 'person@example.com',
			url: 'https://example.com/path',
			uuid: '550e8400-e29b-41d4-a716-446655440000',
			ipv4: '192.168.0.1',
			ipv6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
		}).toJsonSchema();

		expect(schema).to.eql({
			type: 'object',
			properties: {
				at: { type: 'string', format: 'date-time' },
				date: { type: 'string', format: 'date' },
				time: { type: 'string', format: 'time' },
				email: { type: 'string', format: 'email' },
				url: { type: 'string', format: 'uri' },
				uuid: { type: 'string', format: 'uuid' },
				ipv4: { type: 'string', format: 'ipv4' },
				ipv6: { type: 'string', format: 'ipv6' }
			},
			required: ['at', 'date', 'time', 'email', 'url', 'uuid', 'ipv4', 'ipv6']
		});
	});

	it('applies render-time enum and format options from collected stats', () => {
		const generator = createJsonSchemaGenerator()
			.addSamples([
				{ email: 'person@example.com', status: 'new' },
				{ email: 'support@example.com', status: 'new' },
				{ email: 'admin@example.com', status: 'done' },
				{ email: 'help@example.com', status: 'new' }
			]);

		expect(generator.toJsonSchema()).to.eql({
			type: 'object',
			properties: {
				email: { type: 'string', format: 'email' },
				status: { type: 'string', enum: ['new', 'done'] }
			},
			required: ['email', 'status']
		});

		expect(generator.toJsonSchema({ inferFormats: false, inferEnums: false })).to.eql({
			type: 'object',
			properties: {
				email: { type: 'string' },
				status: { type: 'string' }
			},
			required: ['email', 'status']
		});
	});

	it('requires valid JSON samples', () => {
		expect(() => createJsonSchemaGenerator(undefined)).to.throw(TypeError);
		expect(() => createJsonSchemaGenerator(Number.NaN)).to.throw(TypeError);
		expect(() => createJsonSchemaGenerator(() => undefined)).to.throw(TypeError);
		expect(() => createJsonSchemaGenerator(Symbol('x'))).to.throw(TypeError);
		expect(() => createJsonSchemaGenerator(new Date())).to.throw(TypeError);
		expect(() => createJsonSchemaGenerator()).to.not.throw(TypeError);
		expect(() => createJsonSchemaGenerator().toJsonSchema()).to.throw(TypeError);
	});

	it('is exported from utils', () => {
		expect(createJsonSchemaGeneratorFromUtils('text').toJsonSchema()).to.eql({ type: 'string' });
	});
});
