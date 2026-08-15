import { expect } from 'chai';
import type { SourceFieldMatch } from '../../src/react/types.ts';
import {
	convertSuggestionForType,
	typesSuggestible
} from '../../src/react/utils/sourceSuggestions.ts';

describe('source suggestions', () => {
	it('allows numeric source fields for string destinations', () => {
		expect(typesSuggestible('string', 'number')).to.equal(true);
		expect(typesSuggestible('string', 'integer')).to.equal(true);
		expect(typesSuggestible('string', 'boolean')).to.equal(false);
	});

	it('wraps numeric source paths in String() for string destinations', () => {
		const numberField: SourceFieldMatch = {
			path: 'ORDER.TOTAL',
			schema: { type: 'number' }
		};
		const integerField: SourceFieldMatch = {
			path: '$index',
			label: 'Current index',
			schema: { type: 'integer' },
			scope: 'internal'
		};

		expect(convertSuggestionForType(numberField, 'string')).to.deep.equal({
			path: 'String(ORDER.TOTAL)',
			schema: { type: 'number' }
		});
		expect(convertSuggestionForType(integerField, 'string')).to.deep.equal({
			path: 'String($index)',
			label: 'Current index',
			schema: { type: 'integer' },
			scope: 'internal'
		});
	});

	it('keeps suggestions unchanged when no conversion is needed', () => {
		const field: SourceFieldMatch = {
			path: 'ORDER.TOTAL',
			schema: { type: 'number' }
		};

		expect(convertSuggestionForType(field, 'number')).to.equal(field);
	});
});
