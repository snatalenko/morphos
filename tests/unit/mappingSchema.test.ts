import { mappingSchema as schema } from '../../src/index.ts';
import { Validator } from 'jsonschema';
import { expect } from 'chai';

describe('mappingSchema', () => {

	let v: Validator;
	beforeAll(() => {
		v = new Validator();
	});

	it('successfully validates correct mapping', () => {

		let map: any = {
			foo: 'bar'
		};

		v.validate(map, schema, { throwError: true });

		map = {
			map: {
				foo: 'bar'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			forEach: 'test',
			map: {
				foo: 'bar'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			from: 'test',
			map: {
				foo: 'bar'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			from: 'test',
			map: {
				foo: {
					map: {
						bar: 'baz'
					}
				}
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			foo: {
				when: 'bar',
				then: 'bar',
				else: '"fallback"'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			foo: {
				concat: [
					'bar',
					{
						when: 'baz',
						then: 'baz'
					}
				]
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			'*': '*',
			modified: 'x + 1'
		};

		v.validate(map, schema, { throwError: true });

		map = {
			rawData: '*',
			mappedName: 'NAME'
		};

		v.validate(map, schema, { throwError: true });

		map = {
			from: 'BUYER',
			map: {
				rawData: '*',
				mappedName: 'NAME'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			from: 'BUYER',
			map: {
				'*': '*',
				mappedName: 'NAME'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			from: 'values',
			map: {
				'*': '*',
				1: '$context[1] + 10'
			}
		};

		v.validate(map, schema, { throwError: true });

		map = {
			'*': '*'
		};

		v.validate(map, schema, { throwError: true });

		map = [
			'foo',
			{
				bar: 'baz'
			}
		];

		v.validate(map, schema, { throwError: true });
	});

	it('shows errors in incorrect mapping', () => {

		const NOT_ANY_OF_MSG = 'is not exactly one from <#/definitions/StrictMappingObject>,<#/definitions/ObjectFieldsMapping>';

		let map = {};

		expect(v.validate(map, schema)).to.have.nested.property('errors.0').that.includes({
			property: 'instance',
			message: NOT_ANY_OF_MSG
		});

		map = {
			foo: 1
		};

		expect(v.validate(map, schema)).to.have.nested.property('errors.0').that.includes({
			property: 'instance',
			message: NOT_ANY_OF_MSG
		});
	});
});
