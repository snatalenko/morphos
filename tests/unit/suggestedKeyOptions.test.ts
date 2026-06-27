import { expect } from 'chai';
import type { JsonSchema } from '../../src/JsonSchema.ts';
import { suggestedKeyOptions } from '../../src/react/utils/suggestedKeyOptions.ts';

describe('suggestedKeyOptions', () => {
	it('suggests current value before other fields are mapped on a level', () => {
		const schema: JsonSchema = {
			type: 'object',
			required: ['id'],
			properties: {
				id: { type: 'string' },
				name: { type: 'string' }
			}
		};
		const template = {
			id: 'template',
			key: '',
			value: { kind: 'expr' as const, expr: '' },
			template: true
		};

		expect(suggestedKeyOptions([], template, schema, 'Current value')).to.deep.equal([
			{ value: '*', label: 'Current value' },
			{ value: 'id', label: 'id *', group: 'field' },
			{ value: 'name', label: 'name', group: 'field' }
		]);
	});

	it('does not suggest current value for a new field after sibling fields are mapped', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' }
			}
		};
		const entries = [{
			id: 'id',
			key: 'id',
			value: { kind: 'expr' as const, expr: 'ID' }
		}];
		const template = {
			id: 'template',
			key: '',
			value: { kind: 'expr' as const, expr: '' },
			template: true
		};

		expect(suggestedKeyOptions(entries, template, schema, 'Current value')).to.deep.equal([
			{ value: 'name', label: 'name', group: 'field' }
		]);
	});

	it('keeps current value selectable for an existing wildcard entry with overrides', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' }
			}
		};
		const entries = [{
			id: 'wildcard',
			key: '*',
			value: { kind: 'expr' as const, expr: '*' }
		}, {
			id: 'name',
			key: 'name',
			value: { kind: 'expr' as const, expr: 'NAME' }
		}];

		expect(suggestedKeyOptions(entries, entries[0], schema, 'Current value')).to.deep.equal([
			{ value: '*', label: 'Current value' },
			{ value: 'id', label: 'id', group: 'field' }
		]);
	});
});
