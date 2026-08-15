import { expect } from 'chai';
import { createGlobalContext } from '../../src/runtime/index.ts';
import RuntimeValueWrapper from '../../src/runtime/RuntimeValueWrapper.ts';

describe('createGlobalContext', () => {

	it('wraps object and returns `undefined` for all undeclared properties', () => {

		const runtimeValueWrapper = new RuntimeValueWrapper();
		const x = createGlobalContext(runtimeValueWrapper.wrap({ foo: 'bar' }));

		expect(x.foo).to.eq('bar');
		expect(x.test).to.eq(undefined);
		expect(x.constructor).to.eq(undefined);
	});
});
