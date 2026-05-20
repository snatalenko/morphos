import { expect } from 'chai';
import { getPropertySchema } from '../../src/react/utils/schemaProps.ts';

describe('getPropertySchema', () => {
	it('returns object property schemas only', () => {
		const nameSchema = { type: 'string' } as const;
		const parent = {
			type: 'object',
			properties: {
				name: nameSchema,
				unknown: true
			}
		} as const;

		expect(getPropertySchema(undefined, 'name')).to.equal(undefined);
		expect(getPropertySchema({ type: 'object' }, 'name')).to.equal(undefined);
		expect(getPropertySchema(parent, 'missing')).to.equal(undefined);
		expect(getPropertySchema(parent, 'unknown')).to.equal(undefined);
		expect(getPropertySchema(parent, 'name')).to.equal(nameSchema);
	});
});
