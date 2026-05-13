import { createMapper } from '../../src';
import { expect } from 'chai';

describe('createMapper', () => {

	it('returns mapper function', () => {

		const mapper = createMapper({ map: {} });

		expect(mapper).to.be.a('function');
	});

	it('maps constant values', () => {

		const mapper = createMapper({
			map: {
				foo: '"bar"'
			}
		});

		const result = mapper({ a: 'b' });

		expect(result).to.eql({
			foo: 'bar'
		});
	});

	it('maps values from source document', () => {

		const mapper = createMapper({
			map: {
				foo: 'a'
			}
		});

		const result = mapper({ a: 'b' });

		expect(result).to.eql({
			foo: 'b'
		});
	});

	it('maps values from source document (without `map` directive)', () => {

		const mapper = createMapper({
			foo: 'a'
		});

		const result = mapper({ a: 'b' });

		expect(result).to.eql({
			foo: 'b'
		});
	});

	it('maps empty field expression to null', () => {

		const mapper = createMapper({
			map: {
				foo: ''
			}
		});

		const result = mapper({});

		expect(result).to.eql({
			foo: null
		});
	});

	it('maps empty root `*` expression to null', () => {

		const mapper = createMapper({
			map: {
				'*': ''
			}
		});

		const result = mapper({});

		expect(result).to.equal(null);
	});

	it('maps dynamic property names using template expressions', () => {

		const mapper = createMapper({
			map: {
				'${prefix}_${id}': 'value'
			}
		});

		const result = mapper({
			prefix: 'item',
			id: 7,
			value: 'abc'
		});

		expect(result).to.eql({
			item_7: 'abc'
		});
	});

	it('supports escaping template interpolation in property names', () => {

		const mapper = createMapper({
			map: {
				'\\${foo}': '"bar"'
			}
		});

		const result = mapper({ foo: 'ignored' });

		expect(result).to.eql({
			'${foo}': 'bar'
		});
	});

	describe('forEach', () => {

		it('maps loops using `forEach` directive', () => {

			const input = {
				arr: [{
					id: 1,
					qty: 100
				}, {
					id: 2,
					qty: 200
				}]
			};
			const mapper = createMapper({
				forEach: 'arr',
				map: {
					description: "'#' + id + ' - ' + qty + ' items'"
				}
			});

			const result = mapper(input);

			expect(result).to.eql([
				{ description: '#1 - 100 items' },
				{ description: '#2 - 200 items' }
			]);
		});

		it('maps dynamic property names in `forEach` context', () => {

			const mapper = createMapper({
				forEach: 'arr',
				map: {
					'${$index}_${code}': 'qty'
				}
			});

			const result = mapper({
				arr: [
					{ code: 'A', qty: 10 },
					{ code: 'B', qty: 20 }
				]
			});

			expect(result).to.eql([
				{ '0_A': 10 },
				{ '1_B': 20 }
			]);
		});

		it('safely handles nonexistent properties in `forEach` directive', () => {

			const input = {};

			const mapper = createMapper({
				forEach: 'arr',
				map: {
					description: "'#' + id + ' - ' + qty + ' items'"
				}
			});

			const result = mapper(input);

			expect(result).to.eql(undefined);
		});

		it('throws errors on incorrectly formatted instructions', () => {

			expect(() => createMapper({ forEach: 'test', map: '' })).to.throw('Property "map" is empty in mapping "{"forEach":"test","map":""}"');
			expect(() => createMapper({ forEach: '', map: {} })).to.throw('Property "forEach" is empty in mapping "{"forEach":"","map":{}}"');
		});

		it('does not treat mapping as a `forEach` directive if it contains other properties', () => {

			const mapper = createMapper({
				forEach: 'test',
				map: {
					v: 'foo'
				},
				other: '"value"'
			});

			const result = mapper({ test: [{ foo: 'bar' }] });

			expect(result).to.eql({
				forEach: [{ foo: 'bar' }],
				map: {
					v: undefined
				},
				other: 'value'
			});
		});
	});

	describe('from', () => {

		it('allows to switch mapping context using `from` directive', () => {

			const input = {
				container: {
					nested: {
						bar: 'baz',
						bar2: 'baz2'
					}
				}
			};

			const mapper = createMapper({
				from: 'container.nested',
				map: {
					foo: 'bar',
					foo2: '$context.bar2'
				}
			});

			const result = mapper(input);

			expect(result).to.eql({
				foo: 'baz',
				foo2: 'baz2'
			});
		});

		it('maps dynamic property names in `from` context', () => {

			const mapper = createMapper({
				from: 'container.nested',
				map: {
					'${id}': 'value'
				}
			});

			const result = mapper({
				container: {
					nested: {
						id: 'sku_1',
						value: 100
					}
				}
			});

			expect(result).to.eql({
				sku_1: 100
			});
		});

		it('handles references to non-existing properties in `from` directive', () => {

			const input = {
				container: {}
			};

			const mapper = createMapper({
				from: 'container.nested',
				map: {
					foo: 'bar'
				}
			});

			const result = mapper(input);

			expect(result).to.eql({
				foo: undefined
			});
		});

		it('throws errors on incorrectly formatted instructions', () => {

			expect(() => createMapper({ from: 'test', map: '' })).to.throw('Property "map" is empty in mapping "{"from":"test","map":""}"');
			expect(() => createMapper({ from: '', map: {} })).to.throw('Property "from" is empty in mapping "{"from":"","map":{}}"');
		});

		it('does not treat mapping as a `from` directive if it contains other properties', () => {

			const mapper = createMapper({
				from: 'test',
				map: {
					v: 'foo'
				},
				other: '"value"'
			});

			const result = mapper({ test: { foo: 'bar' } });

			expect(result).to.eql({
				from: { foo: 'bar' },
				map: {
					v: undefined
				},
				other: 'value'
			});
		});
	});

	describe('when', () => {

		it('omits object fields when condition is false and `else` is not provided', () => {

			const mapper = createMapper({
				shipment: {
					id: 'shipment.asnNumber',
					purchaseOrder: {
						when: 'shipment.purchaseOrderNumber',
						then: 'shipment.purchaseOrderNumber'
					},
					billOfLading: {
						when: 'shipment.billOfLadingNumber',
						then: 'shipment.billOfLadingNumber'
					}
				}
			});

			const result = mapper({
				shipment: {
					asnNumber: 'ASN-1',
					purchaseOrderNumber: 'PO-1'
				}
			});

			expect(result).to.eql({
				shipment: {
					id: 'ASN-1',
					purchaseOrder: 'PO-1'
				}
			});
		});

		it('maps `else` when condition is false', () => {

			const mapper = createMapper({
				status: {
					when: 'cancelledAt',
					then: '"cancelled"',
					else: '"active"'
				}
			});

			const result = mapper({});

			expect(result).to.eql({
				status: 'active'
			});
		});

		it('maps conditional objects', () => {

			const mapper = createMapper({
				carrier: {
					when: 'shipment.carrierScac || shipment.carrierName',
					then: {
						scac: 'shipment.carrierScac',
						name: 'shipment.carrierName'
					}
				}
			});

			const result = mapper({
				shipment: {
					carrierScac: 'ABCD',
					carrierName: 'Acme Freight'
				}
			});

			expect(result).to.eql({
				carrier: {
					scac: 'ABCD',
					name: 'Acme Freight'
				}
			});
		});

		it('throws errors on incorrectly formatted instructions', () => {

			expect(() => createMapper({ when: '', then: 'foo' })).to.throw('Property "when" is empty in mapping "{"when":"","then":"foo"}"');
			expect(() => createMapper({ when: 'foo' })).to.throw('Property "then" is missing in mapping "{"when":"foo"}"');
		});
	});

	describe('concat', () => {

		it('builds arrays from conditional branches', () => {

			const mapper = createMapper({
				bizTransactionList: {
					concat: [
						{
							when: 'shipment.purchaseOrderNumber',
							then: {
								type: '"po"',
								bizTransaction: 'shipment.purchaseOrderNumber'
							}
						},
						{
							when: 'shipment.asnNumber',
							then: {
								type: '"desadv"',
								bizTransaction: 'shipment.asnNumber'
							}
						},
						{
							when: 'shipment.billOfLadingNumber',
							then: {
								type: '"bol"',
								bizTransaction: 'shipment.billOfLadingNumber'
							}
						}
					]
				}
			});

			const result = mapper({
				shipment: {
					purchaseOrderNumber: 'PO-1',
					asnNumber: 'ASN-1'
				}
			});

			expect(result).to.eql({
				bizTransactionList: [
					{ type: 'po', bizTransaction: 'PO-1' },
					{ type: 'desadv', bizTransaction: 'ASN-1' }
				]
			});
		});

		it('flattens array branch results', () => {

			const mapper = createMapper({
				tags: {
					concat: [
						'baseTags',
						{
							when: 'hazmat',
							then: '"hazmat"'
						}
					]
				}
			});

			const result = mapper({
				baseTags: ['fragile', 'priority'],
				hazmat: true
			});

			expect(result).to.eql({
				tags: ['fragile', 'priority', 'hazmat']
			});
		});

		it('throws errors on incorrectly formatted instructions', () => {

			expect(() => createMapper({ concat: 'foo' } as any)).to.throw('Property "concat" is not an array in mapping "{"concat":"foo"}"');
		});
	});

	it('maps array from array element index maps', () => {

		const input = {
			foo: 'bar'
		};

		const map1 = {
			0: 'foo',
			1: '"baz"'
		};

		const result1 = createMapper(map1)(input);

		expect(result1).to.eql([
			'bar',
			'baz'
		]);

		const map2 = [
			'foo',
			'"baz"'
		];

		const result2 = createMapper(map2)(input);

		expect(result2).to.eql([
			'bar',
			'baz'
		]);

		const map3 = {
			map: [
				'foo',
				'"baz"'
			]
		};

		const result3 = createMapper(map3)(input);

		expect(result3).to.eql([
			'bar',
			'baz'
		]);
	});

	it('maps properties with non-js-compatible characters', () => {

		const result = createMapper({
			'foo.bar': '"baz"',
			'`x': '1',
			'1\'\'': 'false'
		})({});

		expect(result).to.eql({
			'foo.bar': 'baz',
			'`x': 1,
			'1\'\'': false
		});
	});

	it('logs script body as a trace output to logger', () => {

		const log: string[] = [];

		createMapper({
			map: { foo: 'true' }
		}, {
			logger: {
				trace(msg) {
					log.push(msg);
				}
			}
		});

		expect(log).to.have.length(1);
		expect(log[0]).to.eql(`
var $omit = Symbol('declarative-mapper.omit');
with ($createGlobalContext($input)) {
  $result =
    (() => {
      var $output = {};
      var $value;
      $value =
        true;
      if ($value !== $omit)
        $output[\`foo\`] = $value;
      return $output;
    })()
}
if ($result === $omit)
  $result = undefined;`);
	});

	it('accepts mapping runtime extensions', () => {

		const mapper = createMapper({
			map: {
				foo: 'catalog[key]',
				baz: 'prefix(key)'
			}
		}, {
			extensions: {
				catalog: {
					a: 'bar'
				},
				prefix(str) {
					return `prefixed:${str}`;
				}
			}
		});

		const result = mapper({
			key: 'a'
		});

		expect(result).to.eql({
			foo: 'bar',
			baz: 'prefixed:a'
		});
	});

	describe('security', () => {

		it('does not expose process/global objects to mapping expressions', () => {

			const mapper = createMapper({
				directProcess: 'process',
				globalThisProcess: 'globalThis?.process'
			});

			const result = mapper({});

			expect(result).to.eql({
				directProcess: undefined,
				globalThisProcess: undefined
			});
		});

		it('blocks constructor-based access to process', () => {

			const mapper = createMapper({
				value: '(() => { try { return [].filter.constructor("return process")().pid; } catch (e) { return "blocked"; } })()'
			});

			const result = mapper({});

			expect(result).to.eql({
				value: 'blocked'
			});
		});

		it('blocks Function-based require access', () => {

			const mapper = createMapper({
				value: '(() => { try { return Function("return require(\\"fs\\")")(); } catch (e) { return "blocked"; } })()'
			});

			const result = mapper({});

			expect(result).to.eql({
				value: 'blocked'
			});
		});
	});

	describe('*', () => {

		it('maps result from simple type', () => {

			const mapper = createMapper({
				map: {
					'*': 'foo'
				}
			});

			const result = mapper({ foo: 'bar' });

			expect(result).to.eq('bar');
		});

		it('maps array elements from simple types', () => {

			const mapper = createMapper({
				forEach: 'arr',
				map: {
					'*': '$record * 2'
				}
			});

			const result = mapper({ arr: [1, 2, 3] });

			expect(result).to.eql([2, 4, 6]);
		});
	});

	it('throws error if input field names conflict with extension names', () => {
		const mapper = createMapper({
			foo: 'bar'
		}, {
			extensions: {
				bar: 'test'
			}
		});

		expect(() => mapper({ bar: 'baz' })).to.throw('Extension "bar" conflicts with a field name passed in input');
	});

	it('throws errors on incorrectly formatted instructions', () => {

		expect(() => createMapper({ map: '' })).to.throw('Property "map" is empty in mapping "{"map":""}"');
	});

	it('works with global objects', () => {

		const mapper = createMapper({
			d: 'new Date().toISOString()',
			m: 'Math.round(1.1)',
			i: 'Infinity'
		});

		const r = mapper({});

		expect(r).to.have.property('d').that.is.not.empty;
		expect(r).to.have.property('m').that.eqls(1);
		expect(r).to.have.property('i').that.eqls(Infinity);
	});

	it('works fast', () => {

		const mapper = createMapper({
			map: {
				foo: 'dict[bar]'
			}
		}, {
			extensions: {
				dict: {
					a: 'b',
					x: 'y'
				}
			}
		});

		for (let i = 0; i < 10000; i++)
			mapper({ bar: 'a' });
	});
});
