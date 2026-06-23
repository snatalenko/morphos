import {
	createJsonSchemaGenerator,
	type JsonSchema,
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
			additionalProperties: true,
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
			additionalProperties: true,
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
			additionalProperties: true,
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
					additionalProperties: true,
					required: ['kind', 'amount']
				},
				{
					type: 'object',
					properties: {
						email: { type: 'string', format: 'email' }
					},
					additionalProperties: true,
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
					additionalProperties: true,
					required: ['a']
				},
				{
					type: 'object',
					properties: {
						b: { type: 'boolean' }
					},
					additionalProperties: true,
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
			additionalProperties: true,
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
					additionalProperties: true,
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
					additionalProperties: true,
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
				additionalProperties: true,
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

	it('uses overlap object matching for sparse table rows by default', () => {
		const rows = [
			{
				Name: 'North Warehouse',
				Id: '11111111111141118111111111111111',
				Transfers_Count_Widget_2024_01_W01: 1,
				Transferred_Widget_2024_01_W01: 13.0601,
				Supplied_Widget_2024_01_W01: 13.0601
			},
			{
				Name: 'South Depot',
				Id: '22222222222242228222222222222222',
				Email: 'south.depot@example.com'
			},
			{
				Name: 'East Supplier',
				Id: '33333333333343338333333333333333',
				Phone_Number: '+1 555 0100',
				Email: 'east.supplier@example.com',
				Transfers_Count_Widget_2024_01_W01: 1,
				Transferred_Widget_2024_01_W01: 1,
				Supplied_Widget_2024_01_W01: 0.5
			},
			{
				Name: 'West Supplier',
				Id: '44444444444444448444444444444444',
				Email: 'west.supplier@example.com',
				Transfers_Count_Widget_2024_01_W01: 1,
				Transferred_Widget_2024_01_W01: 100,
				Supplied_Widget_2024_01_W01: 0.0001,
				Transfers_Count_Gadget_G01: 3,
				Transferred_Gadget_G01: 5,
				Supplied_Gadget_G01: 0.052775
			}
		];
		const schema = createJsonSchemaGenerator(rows).toJsonSchema();
		const itemSchema = schema.items as JsonSchema;

		expect(schema.type).to.equal('array');
		expect(itemSchema).to.not.have.property('oneOf');
		expect(itemSchema).to.include({
			type: 'object',
			additionalProperties: true
		});
		expect(itemSchema.required).to.eql(['Name', 'Id']);
		expect(itemSchema).to.have.nested.property('properties.Name.type', 'string');
		expect(itemSchema).to.not.have.nested.property('properties.Name.enum');
		expect(itemSchema).to.have.nested.property('properties.Id.format', 'uuid');
		expect(itemSchema).to.have.nested.property('properties.Email.format', 'email');
		expect(itemSchema).to.have.nested.property('properties.Phone_Number.type', 'string');
		expect(itemSchema).to.have.nested.property('properties.Transfers_Count_Gadget_G01.type', 'integer');
		expect(itemSchema).to.have.nested.property('properties.Supplied_Gadget_G01.type', 'number');

		const jaccardItemSchema = createJsonSchemaGenerator(rows, {
			objectMatchStrategy: 'jaccard'
		}).toJsonSchema().items as JsonSchema;

		expect(jaccardItemSchema).to.have.property('oneOf');
	});

	it('requires the configured minimum shared properties before merging object samples', () => {
		const samples = [
			{ id: 'A', left: true },
			{ id: 'B', right: true }
		];
		const defaultSchema = createJsonSchemaGenerator()
			.addSamples(samples)
			.toJsonSchema();

		expect(defaultSchema).to.have.property('oneOf');

		const permissiveSchema = createJsonSchemaGenerator(samples[0], {
			objectMatchMinSharedProperties: 1
		})
			.addSample(samples[1])
			.toJsonSchema();

		expect(permissiveSchema).to.not.have.property('oneOf');
		expect(permissiveSchema).to.have.property('required').that.eql(['id']);
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
			additionalProperties: true,
			required: ['status']
		});

		const rowSchema = createJsonSchemaGenerator()
			.addSamples([
				{
					Type: 'transfer',
					'Unit of Measure': 'Kilogram',
					'Document Type': 'Receipt',
					'Asset Name': 'Widget',
					'Asset Code': 'WIDGET',
					From: 'North Warehouse',
					To: 'South Depot'
				},
				{
					Type: 'transformation',
					'Unit of Measure': 'Kilogram',
					'Document Type': 'Receipt',
					'Asset Name': 'Widget',
					'Asset Code': 'WIDGET',
					From: 'North Warehouse',
					To: 'South Depot'
				},
				{
					Type: 'transfer',
					'Unit of Measure': 'Kilogram',
					'Document Type': 'Receipt',
					'Asset Name': 'Widget 2024-01',
					'Asset Code': 'W01',
					From: 'West Supplier',
					To: 'South Depot'
				}
			])
			.toJsonSchema();

		expect(rowSchema).to.have.nested.property('properties.Type.enum').that.eql(['transfer', 'transformation']);
		expect(rowSchema).to.have.nested.property('properties.Unit of Measure.enum').that.eql(['Kilogram']);
		expect(rowSchema).to.have.nested.property('properties.Document Type.enum').that.eql(['Receipt']);
		expect(rowSchema).to.not.have.nested.property('properties.Asset Name.enum');
		expect(rowSchema).to.not.have.nested.property('properties.Asset Code.enum');
		expect(rowSchema).to.not.have.nested.property('properties.From.enum');
		expect(rowSchema).to.not.have.nested.property('properties.To.enum');

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
			additionalProperties: true,
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
			additionalProperties: true,
			required: ['value']
		});
	});

	it('emits additionalProperties on inferred object schemas', () => {
		const schema = createJsonSchemaGenerator({
			id: 1,
			nested: {
				name: 'Alice'
			},
			items: [
				{ code: 'A' }
			]
		}, {
			additionalProperties: false
		}).toJsonSchema();

		expect(schema).to.eql({
			type: 'object',
			properties: {
				id: { type: 'integer' },
				nested: {
					type: 'object',
					properties: {
						name: { type: 'string' }
					},
					additionalProperties: false,
					required: ['name']
				},
				items: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							code: { type: 'string' }
						},
						additionalProperties: false,
						required: ['code']
					}
				}
			},
			additionalProperties: false,
			required: ['id', 'nested', 'items']
		});
	});

	it('can omit required arrays on inferred object schemas', () => {
		const schema = createJsonSchemaGenerator({
			id: 1,
			nested: {
				name: 'Alice'
			},
			items: [
				{ code: 'A' }
			]
		}, {
			required: false
		}).toJsonSchema();

		expect(schema).to.eql({
			type: 'object',
			properties: {
				id: { type: 'integer' },
				nested: {
					type: 'object',
					properties: {
						name: { type: 'string' }
					},
					additionalProperties: true
				},
				items: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							code: { type: 'string' }
						},
						additionalProperties: true
					}
				}
			},
			additionalProperties: true
		});
	});

	it('can emit bounded unique examples for simple type fields', () => {
		const schema = createJsonSchemaGenerator(undefined, {
			maxExamples: 2
		})
			.addSamples([
				{
					status: 'draft',
					count: 1,
					enabled: true,
					tags: ['red', 'blue', 'red'],
					nested: {
						score: 10
					}
				},
				{
					status: 'draft',
					count: 2,
					enabled: false,
					tags: ['green'],
					nested: {
						score: 11
					}
				},
				{
					status: 'sent',
					count: 3,
					enabled: true,
					tags: ['yellow'],
					nested: {
						score: 12
					}
				}
			])
			.toJsonSchema();

		expect(schema).to.have.nested.property('properties.status.enum').that.eql(['draft', 'sent']);
		expect(schema).to.not.have.nested.property('properties.status.examples');
		expect(schema).to.have.nested.property('properties.count.examples').that.eql([1, 2]);
		expect(schema).to.have.nested.property('properties.enabled.examples').that.eql([true, false]);
		expect(schema).to.have.nested.property('properties.tags.items.examples').that.eql(['red', 'blue']);
		expect(schema).to.have.nested.property('properties.nested.properties.score.examples').that.eql([10, 11]);
		expect(schema).to.not.have.property('examples');
		expect(schema).to.not.have.nested.property('properties.tags.examples');
		expect(schema).to.not.have.nested.property('properties.nested.examples');
	});

	it('keeps examples disabled by default and supports render-time limits', () => {
		const disabledSchema = createJsonSchemaGenerator()
			.addSamples([
				{ name: 'Alpha' },
				{ name: 'Beta' }
			])
			.toJsonSchema();

		expect(disabledSchema).to.not.have.nested.property('properties.name.examples');

		const generator = createJsonSchemaGenerator(undefined, {
			maxExamples: 3
		})
			.addSamples([
				{ name: 'Alpha' },
				{ name: 'Beta' },
				{ name: 'Gamma' }
			]);

		expect(generator.toJsonSchema()).to.have.nested.property('properties.name.examples').that.eql([
			'Alpha',
			'Beta',
			'Gamma'
		]);
		expect(generator.toJsonSchema({ maxExamples: 1 })).to.have.nested.property('properties.name.examples').that.eql([
			'Alpha'
		]);
		expect(generator.toJsonSchema({ maxExamples: 0 })).to.not.have.nested.property('properties.name.examples');
	});

	it('supports enum detection options', () => {
		const defaultSchema = createJsonSchemaGenerator()
			.addSamples([
				{ country: 'ZM' },
				{ country: 'ZM' },
				{ country: 'US' },
				{ country: 'ZM' }
			])
			.toJsonSchema();

		expect(defaultSchema).to.not.have.nested.property('properties.country.enum');

		const configuredSchema = createJsonSchemaGenerator({ country: 'ZM' }, {
			enumDetection: {
				highProbabilityNames: ['country'],
				lowProbabilityNames: []
			}
		})
			.addSamples([
				{ country: 'ZM' },
				{ country: 'US' },
				{ country: 'ZM' }
			])
			.toJsonSchema();

		expect(configuredSchema).to.have.nested.property('properties.country.enum').that.eql(['ZM', 'US']);

		const lowProbabilityOverrideSchema = createJsonSchemaGenerator({ status: 'new' }, {
			enumDetection: {
				lowProbabilityNames: ['status']
			}
		})
			.addSamples([
				{ status: 'new' },
				{ status: 'done' },
				{ status: 'new' }
			])
			.toJsonSchema();

		expect(lowProbabilityOverrideSchema).to.not.have.nested.property('properties.status.enum');
	});

	it('matches low-probability enum names as normalized name tokens', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				{
					AssetCode: 'WIDGET',
					ASSET_CODE: 'WIDGET',
					'asset-code': 'ITEM',
					someOtherCode: 'SKU-1',
					'Some Code': 'REF-1',
					AssetName: 'Widget',
					asset_id: '11111111111141118111111111111111'
				},
				{
					AssetCode: 'WIDGET',
					ASSET_CODE: 'WIDGET',
					'asset-code': 'ITEM',
					someOtherCode: 'SKU-1',
					'Some Code': 'REF-1',
					AssetName: 'Widget',
					asset_id: '11111111111141118111111111111111'
				},
				{
					AssetCode: 'W01',
					ASSET_CODE: 'GADGET',
					'asset-code': 'PART',
					someOtherCode: 'SKU-2',
					'Some Code': 'REF-2',
					AssetName: 'Widget 2024-01',
					asset_id: '22222222222242228222222222222222'
				},
				{
					AssetCode: 'WIDGET',
					ASSET_CODE: 'WIDGET',
					'asset-code': 'ITEM',
					someOtherCode: 'SKU-1',
					'Some Code': 'REF-1',
					AssetName: 'Widget',
					asset_id: '11111111111141118111111111111111'
				}
			])
			.toJsonSchema({
				enumDetection: {
					highProbabilityNames: [
						'AssetCode',
						'ASSET_CODE',
						'asset-code',
						'someOtherCode',
						'Some Code',
						'AssetName',
						'asset_id'
					]
				}
			});

		expect(schema).to.not.have.nested.property('properties.AssetCode.enum');
		expect(schema).to.not.have.nested.property('properties.ASSET_CODE.enum');
		expect(schema).to.not.have.nested.property('properties.asset-code.enum');
		expect(schema).to.not.have.nested.property('properties.someOtherCode.enum');
		expect(schema).to.not.have.nested.property('properties.Some Code.enum');
		expect(schema).to.not.have.nested.property('properties.AssetName.enum');
		expect(schema).to.not.have.nested.property('properties.asset_id.enum');
	});

	it('blocks enum inference for formatted and long string values', () => {
		const schema = createJsonSchemaGenerator()
			.addSamples([
				{
					status: 'new',
					operationId: '11111111111141118111111111111111',
					type: '012345678901234567890123456789012'
				},
				{
					status: 'new',
					operationId: '11111111111141118111111111111111',
					type: '012345678901234567890123456789012'
				},
				{
					status: 'done',
					operationId: '22222222222242228222222222222222',
					type: 'short'
				},
				{
					status: 'new',
					operationId: '11111111111141118111111111111111',
					type: 'short'
				}
			])
			.toJsonSchema();

		expect(schema).to.have.nested.property('properties.status.enum').that.eql(['new', 'done']);
		expect(schema).to.have.nested.property('properties.operationId.format', 'uuid');
		expect(schema).to.not.have.nested.property('properties.operationId.enum');
		expect(schema).to.not.have.nested.property('properties.type.enum');

		const configuredSchema = createJsonSchemaGenerator({ type: '012345678901234567890123456789012' }, {
			enumDetection: {
				maxValueLength: 40
			}
		})
			.addSamples([
				{ type: '012345678901234567890123456789012' },
				{ type: 'short' },
				{ type: '012345678901234567890123456789012' }
			])
			.toJsonSchema();

		expect(configuredSchema).to.have.nested.property('properties.type.enum').that.eql([
			'012345678901234567890123456789012',
			'short'
		]);
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
			additionalProperties: true,
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
			additionalProperties: true,
			required: ['email', 'status']
		});

		expect(generator.toJsonSchema({ inferFormats: false, inferEnums: false })).to.eql({
			type: 'object',
			properties: {
				email: { type: 'string' },
				status: { type: 'string' }
			},
			additionalProperties: true,
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
