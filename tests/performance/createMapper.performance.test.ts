import { createMapper } from '../../src/index.ts';
import { expect } from 'chai';
import { performance } from 'node:perf_hooks';

type BenchmarkCase<TSource extends object, TResult> = {
	name: string,
	documents: TSource[],
	mapper: (document: TSource) => TResult
}

type BenchmarkResult = {
	case: string,
	documents: number,
	elapsedMs: number,
	objectsPerSecond: number,
}

type SimpleDocument = {
	id: number,
	sku: string,
	qty: number,
	price: number,
	active: boolean
}

type SimpleResult = {
	id: number,
	sku: string,
	amount: number,
	label: string,
	active: boolean
}

type ComplexDocument = {
	id: number,
	customer: {
		name: string,
		tier: string
	},
	lines: Array<{
		sku: string,
		qty: number,
		price: number,
		tags: string[],
		discounts: Array<{ amount: number }>
	}>,
	shipments: Array<{
		carrier: string,
		tracking: string
	}>
}

type ComplexResult = {
	id: number,
	customerName: string,
	tier: string,
	lineCount: number,
	total: number,
	tags: string[],
	lines: Array<{
		sku: string,
		amount: number,
		discount: number,
		firstTag: string
	}>,
	shipmentCodes: string[]
}

const SAMPLE_DOCUMENT_COUNT = 1000;

function createSimpleDocuments() {
	return Array.from({ length: SAMPLE_DOCUMENT_COUNT }, (_, index): SimpleDocument => ({
		id: index,
		sku: `SKU-${index % 100}`,
		qty: (index % 5) + 1,
		price: ((index % 17) + 3) / 2,
		active: index % 3 !== 0
	}));
}

function createComplexDocuments() {
	return Array.from({ length: SAMPLE_DOCUMENT_COUNT }, (_, index): ComplexDocument => ({
		id: index,
		customer: {
			name: ` Customer ${index} `,
			tier: index % 2 === 0 ? 'gold' : 'standard'
		},
		lines: Array.from({ length: 8 }, (_line, lineIndex) => ({
			sku: `SKU-${(index + lineIndex) % 200}`,
			qty: (lineIndex % 4) + 1,
			price: ((index + lineIndex) % 19) + 1.25,
			tags: [`tag-${lineIndex % 3}`, `group-${index % 5}`],
			discounts: [
				{ amount: lineIndex % 2 === 0 ? 0.5 : 0 },
				{ amount: index % 7 === 0 ? 0.25 : 0 }
			]
		})),
		shipments: [
			{ carrier: 'ups', tracking: `1Z${index}` },
			{ carrier: 'fedex', tracking: `FX${index}` }
		]
	}));
}

function benchmark<TSource extends object, TResult>({
	name,
	documents,
	mapper
}: BenchmarkCase<TSource, TResult>): BenchmarkResult {

	for (const document of documents.slice(0, 100))
		mapper(document);

	const startedAt = performance.now();

	for (const document of documents)
		mapper(document);

	const elapsedMs = Number(performance.now() - startedAt);

	return {
		case: name,
		documents: documents.length,
		elapsedMs: Math.round(elapsedMs * 100) / 100,
		objectsPerSecond: Math.round((documents.length / elapsedMs) * 1000)
	};
}

describe('createMapper performance', () => {

	it('reports simple and complex object throughput', () => {

		const simpleMapper = createMapper<SimpleDocument, SimpleResult>({
			id: 'id',
			sku: 'sku',
			amount: 'qty * price',
			label: '`${id}:${sku}`',
			active: 'active'
		});

		const complexMapper = createMapper<ComplexDocument, ComplexResult>({
			id: 'id',
			customerName: 'customer.name.trim().toUpperCase()',
			tier: 'customer.tier',
			lineCount: 'lines.length',
			total: 'lines.reduce((sum, line) => sum + line.qty * line.price - line.discounts.reduce((d, x) => d + x.amount, 0), 0)',
			tags: 'lines.flatMap(line => line.tags)',
			lines: {
				forEach: 'lines',
				map: {
					sku: 'sku',
					amount: 'qty * price',
					discount: 'discounts.reduce((sum, discount) => sum + discount.amount, 0)',
					firstTag: 'tags[0]'
				}
			},
			shipmentCodes: {
				forEach: 'shipments',
				map: {
					'*': '`${carrier}:${tracking}`'
				}
			}
		});

		const complexDocuments = createComplexDocuments();

		const results = [
			benchmark({
				name: 'simple',
				documents: createSimpleDocuments(),
				mapper: simpleMapper
			}),
			benchmark({
				name: 'complex',
				documents: complexDocuments,
				mapper: complexMapper
			})
		];

		console.table(results);

		expect(results.find(r => r.case === 'simple')?.objectsPerSecond).be.greaterThan(100_000);
		expect(results.find(r => r.case === 'complex')?.objectsPerSecond).be.greaterThan(20_000);
	});
});
