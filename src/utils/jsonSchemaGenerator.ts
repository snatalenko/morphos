import type { JsonSchema } from '../JsonSchema.ts';

export type JsonSchemaGeneratorOptions = {

	/**
	 * Keyword used when samples cannot be represented by a single schema.
	 * Defaults to "oneOf".
	 */
	unionKeyword?: 'oneOf' | 'anyOf';

	/**
	 * Minimum ratio of shared object property names required to merge an object
	 * sample into an existing object schema cluster. Defaults to 0.5.
	 */
	objectMatchThreshold?: number;

	/**
	 * Similarity metric used for object clustering. "overlap" compares shared
	 * properties to the smaller property set and is better for sparse table rows.
	 * "jaccard" compares shared properties to the combined property set.
	 * Defaults to "overlap".
	 */
	objectMatchStrategy?: 'overlap' | 'jaccard';

	/**
	 * Minimum number of shared property names required before two object samples
	 * can be merged into the same object schema cluster. The effective value is
	 * capped by the smaller object's property count so one-column and subset
	 * shapes can still merge. Defaults to 2.
	 */
	objectMatchMinSharedProperties?: number;

	/**
	 * Value emitted as additionalProperties on inferred object schemas. Defaults
	 * to true. Set to false to make every inferred object schema closed.
	 */
	additionalProperties?: boolean;

	/**
	 * Emit required arrays for object fields seen in every matching object
	 * sample. Defaults to true. Set to false to omit required arrays entirely.
	 */
	required?: boolean;

	/**
	 * Maximum number of unique primitive sample values to emit under the JSON
	 * Schema examples keyword for simple type fields. Defaults to 0, which skips
	 * example collection. Set this before adding samples to collect examples.
	 */
	maxExamples?: number;

	/**
	 * Infer string enums from repeated low-cardinality values. Defaults to true.
	 */
	inferEnums?: boolean;

	/**
	 * Configure string enum detection. Name lists are matched case-insensitively
	 * against normalized property names. Low-probability names block enum
	 * inference. Object property names must match the high-probability list to
	 * infer enums; root and array item strings use only value distribution.
	 * Values longer than maxValueLength block enum inference. Defaults:
	 * maxValueLength 32, plus built-in high/low probability name lists.
	 */
	enumDetection?: JsonSchemaEnumDetectionOptions;

	/**
	 * Infer common string formats such as date-time, date, email, uri, uuid,
	 * ipv4, and ipv6. Defaults to true.
	 */
	inferFormats?: boolean;
}

export type JsonSchemaEnumDetectionOptions = {

	/**
	 * Property names that are likely to be categorical enum fields. Matched
	 * case-insensitively after normalizing spaces, separators, and camelCase.
	 */
	highProbabilityNames?: string[];

	/**
	 * Property names that are likely to be identifiers, labels, or free text.
	 * Matched as normalized name tokens after normalizing spaces, separators,
	 * and camelCase. Matching names block enum inference.
	 */
	lowProbabilityNames?: string[];

	/**
	 * Maximum string value length allowed for inferred enums. Any longer observed
	 * value blocks enum inference for that field. Defaults to 32.
	 */
	maxValueLength?: number;
}

export type JsonSchemaGenerator = {
	addSample(sample: unknown): JsonSchemaGenerator;
	addSamples(samples: unknown[]): JsonSchemaGenerator;
	toJsonSchema(options?: JsonSchemaGeneratorOptions): JsonSchema;
}

type JsonType = 'null' | 'boolean' | 'string' | 'integer' | 'number' | 'object' | 'array';

type RequiredEnumDetectionOptions = Required<JsonSchemaEnumDetectionOptions>;

type RequiredOptions = Omit<Required<JsonSchemaGeneratorOptions>, 'enumDetection'> & {
	enumDetection: RequiredEnumDetectionOptions;
}

type StringFormat = 'date-time' | 'date' | 'time' | 'email' | 'uri' | 'uuid' | 'ipv4' | 'ipv6';

type SimpleJsonType = Exclude<JsonType, 'object' | 'array'>;

type JsonSchemaStats = {
	count: number;
	propertyName?: string;
	types: JsonType[];
	examples?: Map<SimpleJsonType, ExampleStats>;
	string?: StringStats;
	array?: ArrayStats;
	objectClusters: ObjectClusterStats[];
}

type ExampleStats = {
	values: unknown[];
	keys: Set<string>;
}

type StringStats = {
	count: number;
	enumCounts: Map<string, number>;
	enumOverflow: boolean;
	hasLongEnumValue: boolean;
	formatCandidates: Set<StringFormat>;
}

type ArrayStats = {
	items?: JsonSchemaStats;
}

type ObjectClusterStats = {
	count: number;
	keys: Set<string>;
	properties: Map<string, ObjectPropertyStats>;
}

type ObjectPropertyStats = {
	count: number;
	stats: JsonSchemaStats;
}

const ENUM_MAX_VALUES = 10;
const DEFAULT_ENUM_DETECTION: RequiredEnumDetectionOptions = {
	highProbabilityNames: [
		'action',
		'category',
		'kind',
		'role',
		'state',
		'status',
		'type',
		'unit'
	],
	lowProbabilityNames: [
		'address',
		'code',
		'description',
		'email',
		'file',
		'from',
		'hash',
		'id',
		'md5',
		'name',
		'number',
		'phone',
		'to',
		'url'
	],
	maxValueLength: 32
};

const DEFAULT_OPTIONS: Omit<RequiredOptions, 'enumDetection'> = {
	unionKeyword: 'oneOf',
	objectMatchThreshold: 0.5,
	objectMatchStrategy: 'overlap',
	objectMatchMinSharedProperties: 2,
	additionalProperties: true,
	required: true,
	maxExamples: 0,
	inferEnums: true,
	inferFormats: true
};

const FORMAT_DETECTORS: Array<[StringFormat, (value: string) => boolean]> = [
	['date-time', isIsoDateTime],
	['date', isIsoDate],
	['time', isIsoTime],
	['email', isEmail],
	['uri', isUri],
	['uuid', isUuid],
	['ipv4', isIpv4],
	['ipv6', isIpv6]
];

function normalizeOptions(options?: JsonSchemaGeneratorOptions): RequiredOptions {
	return {
		...DEFAULT_OPTIONS,
		...options,
		maxExamples: normalizeMaxExamples(options?.maxExamples ?? DEFAULT_OPTIONS.maxExamples),
		enumDetection: normalizeEnumDetectionOptions(options?.enumDetection)
	};
}

function normalizeMaxExamples(value: number): number {
	if (!Number.isFinite(value) || value <= 0)
		return 0;

	return Math.floor(value);
}

function normalizeEnumDetectionOptions(
	options?: JsonSchemaEnumDetectionOptions
): RequiredEnumDetectionOptions {
	return {
		...DEFAULT_ENUM_DETECTION,
		...options
	};
}

function createStats(propertyName?: string): JsonSchemaStats {
	return {
		count: 0,
		propertyName,
		types: [],
		objectClusters: []
	};
}

function createStringStats(): StringStats {
	return {
		count: 0,
		enumCounts: new Map(),
		enumOverflow: false,
		hasLongEnumValue: false,
		formatCandidates: new Set(FORMAT_DETECTORS.map(([format]) => format))
	};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value))
		return false;

	const proto = Object.getPrototypeOf(value);

	return proto === Object.prototype || proto === null;
}

function addType(types: JsonType[], type: JsonType): void {
	if (type === 'number') {
		const integerIndex = types.indexOf('integer');
		if (integerIndex !== -1)
			types.splice(integerIndex, 1);
	}

	if (type === 'integer' && types.includes('number'))
		return;

	if (!types.includes(type))
		types.push(type);
}

function orderedSchemaTypes(stats: JsonSchemaStats): JsonType[] {
	return [...stats.types].sort((a, b) => {
		if (a === 'null')
			return 1;

		if (b === 'null')
			return -1;

		return 0;
	});
}

function observe(stats: JsonSchemaStats, sample: unknown, options: RequiredOptions, path: string): void {
	if (sample === null) {
		observeType(stats, 'null');
		observeExample(stats, 'null', sample, options);

		return;
	}

	if (typeof sample === 'string') {
		observeType(stats, 'string');
		observeExample(stats, 'string', sample, options);
		observeString(stats, sample, options);

		return;
	}

	if (typeof sample === 'boolean') {
		observeType(stats, 'boolean');
		observeExample(stats, 'boolean', sample, options);

		return;
	}

	if (typeof sample === 'number') {
		if (!Number.isFinite(sample))
			throw new TypeError(`Invalid JSON sample at "${path}": numbers must be finite`);

		const type = Number.isInteger(sample) ? 'integer' : 'number';

		observeType(stats, type);
		observeExample(stats, type, sample, options);

		return;
	}

	if (Array.isArray(sample)) {
		observeType(stats, 'array');
		observeArray(stats, sample, options, path);

		return;
	}

	if (isPlainObject(sample)) {
		observeType(stats, 'object');
		observeObject(stats, sample, options, path);

		return;
	}

	throw new TypeError(`Invalid JSON sample at "${path}": ${Object.prototype.toString.call(sample)}`);
}

function observeType(stats: JsonSchemaStats, type: JsonType): void {
	stats.count++;
	addType(stats.types, type);
}

function observeExample(
	stats: JsonSchemaStats,
	type: SimpleJsonType,
	value: unknown,
	options: RequiredOptions
): void {
	if (options.maxExamples <= 0)
		return;

	const exampleStats = stats.examples ?? (stats.examples = new Map());
	let typeExamples = exampleStats.get(type);

	if (!typeExamples) {
		typeExamples = {
			values: [],
			keys: new Set()
		};
		exampleStats.set(type, typeExamples);
	}

	if (typeExamples.values.length >= options.maxExamples)
		return;

	const key = exampleKey(type, value);

	if (typeExamples.keys.has(key))
		return;

	typeExamples.keys.add(key);
	typeExamples.values.push(value);
}

function exampleKey(type: SimpleJsonType, value: unknown): string {
	return `${type}:${JSON.stringify(value)}`;
}

function observeString(stats: JsonSchemaStats, value: string, options: RequiredOptions): void {
	const stringStats = stats.string ?? (stats.string = createStringStats());

	stringStats.count++;
	observeStringEnum(stringStats, value, options.enumDetection);
	observeStringFormat(stringStats, value);
}

function observeStringEnum(stats: StringStats, value: string, options: RequiredEnumDetectionOptions): void {
	if (value.length > options.maxValueLength)
		stats.hasLongEnumValue = true;

	if (stats.enumOverflow)
		return;

	const currentCount = stats.enumCounts.get(value);

	if (currentCount !== undefined) {
		stats.enumCounts.set(value, currentCount + 1);

		return;
	}

	if (stats.enumCounts.size >= ENUM_MAX_VALUES) {
		stats.enumOverflow = true;

		return;
	}

	stats.enumCounts.set(value, 1);
}

function observeStringFormat(stats: StringStats, value: string): void {
	for (const [format, detector] of FORMAT_DETECTORS) {
		if (stats.formatCandidates.has(format) && !detector(value))
			stats.formatCandidates.delete(format);
	}
}

function observeArray(stats: JsonSchemaStats, sample: unknown[], options: RequiredOptions, path: string): void {
	const arrayStats = stats.array ?? (stats.array = {});

	for (let index = 0; index < sample.length; index++) {
		arrayStats.items ??= createStats();
		observe(arrayStats.items, sample[index], options, `${path}[${index}]`);
	}
}

function observeObject(
	stats: JsonSchemaStats,
	sample: Record<string, unknown>,
	options: RequiredOptions,
	path: string
): void {
	const cluster = matchingObjectCluster(stats.objectClusters, sample, options);

	cluster.count++;

	for (const [key, value] of Object.entries(sample)) {
		cluster.keys.add(key);

		let property = cluster.properties.get(key);

		if (!property) {
			property = {
				count: 0,
				stats: createStats(key)
			};
			cluster.properties.set(key, property);
		}

		property.count++;
		observe(property.stats, value, options, path === '$' ? `$.${key}` : `${path}.${key}`);
	}
}

function matchingObjectCluster(
	clusters: ObjectClusterStats[],
	sample: Record<string, unknown>,
	options: RequiredOptions
): ObjectClusterStats {
	const sampleKeys = new Set(Object.keys(sample));
	const cluster = clusters.find(existing => objectMatchesCluster(sampleKeys, existing.keys, options));

	if (cluster)
		return cluster;

	const next: ObjectClusterStats = {
		count: 0,
		keys: new Set(),
		properties: new Map()
	};

	clusters.push(next);

	return next;
}

function objectMatchesCluster(
	sampleKeys: Set<string>,
	existingKeys: Set<string>,
	options: RequiredOptions
): boolean {
	const shared = sharedPropertyCount(sampleKeys, existingKeys);
	const minShared = Math.min(options.objectMatchMinSharedProperties, sampleKeys.size, existingKeys.size);

	return shared >= minShared &&
		objectSimilarity(sampleKeys, existingKeys, shared, options.objectMatchStrategy) >= options.objectMatchThreshold;
}

function sharedPropertyCount(sampleKeys: Set<string>, existingKeys: Set<string>): number {
	let shared = 0;

	for (const key of sampleKeys) {
		if (existingKeys.has(key))
			shared++;
	}

	return shared;
}

function objectSimilarity(
	sampleKeys: Set<string>,
	existingKeys: Set<string>,
	shared: number,
	strategy: RequiredOptions['objectMatchStrategy']
): number {
	const unionKeys = new Set([...existingKeys, ...sampleKeys]);

	if (!unionKeys.size)
		return 1;

	if (strategy === 'overlap')
		return shared / Math.min(sampleKeys.size, existingKeys.size);

	return shared / unionKeys.size;
}

function schemaWithNullable(schema: JsonSchema): JsonSchema {
	const type = schema.type;

	if (Array.isArray(type)) {
		if (type.includes('null'))
			return schema;

		return {
			...schema,
			type: [...type, 'null']
		};
	}

	if (type === undefined || type === 'null')
		return schema;

	return {
		...schema,
		type: [type, 'null']
	};
}

function schemaFromStats(stats: JsonSchemaStats, options: RequiredOptions): JsonSchema {
	if (!stats.count)
		throw new TypeError('Cannot generate JSON schema without samples');

	const types = orderedSchemaTypes(stats);
	const nonNullTypes = types.filter(type => type !== 'null');
	const hasNull = types.length !== nonNullTypes.length;

	if (!nonNullTypes.length)
		return schemaWithExamples({ type: 'null' }, stats, ['null'], options);

	if (nonNullTypes.length === 1) {
		const schema = schemaForType(stats, nonNullTypes[0], options);

		return hasNull ? schemaWithNullable(schema) : schema;
	}

	if (nonNullTypes.every(isPrimitiveType))
		return schemaWithExamples({ type: types }, stats, types as SimpleJsonType[], options);

	const branches = nonNullTypes.map(type => schemaForType(stats, type, options));
	const unionSchema = {
		[options.unionKeyword]: hasNull ? [...branches, { type: 'null' }] : branches
	};

	return unionSchema;
}

function isPrimitiveType(type: JsonType): boolean {
	return type === 'null' || type === 'boolean' || type === 'string' || type === 'integer' || type === 'number';
}

function schemaForType(stats: JsonSchemaStats, type: JsonType, options: RequiredOptions): JsonSchema {
	if (type === 'string') {
		return schemaWithExamples(
			stringSchemaFromStats(stats.string, options, stats.propertyName),
			stats,
			['string'],
			options
		);
	}

	if (type === 'object')
		return objectSchemaFromStats(stats.objectClusters, options);

	if (type === 'array')
		return arraySchemaFromStats(stats.array, options);

	return schemaWithExamples(
		{ type },
		stats,
		type === 'number' ? ['integer', 'number'] : [type],
		options
	);
}

function schemaWithExamples(
	schema: JsonSchema,
	stats: JsonSchemaStats,
	types: SimpleJsonType[],
	options: RequiredOptions
): JsonSchema {
	if (options.maxExamples <= 0 || !stats.examples || schema.enum)
		return schema;

	const examples: unknown[] = [];

	for (const type of types) {
		for (const value of stats.examples.get(type)?.values ?? []) {
			if (examples.length >= options.maxExamples)
				break;

			examples.push(value);
		}

		if (examples.length >= options.maxExamples)
			break;
	}

	if (!examples.length)
		return schema;

	return {
		...schema,
		examples
	};
}

function arraySchemaFromStats(stats: ArrayStats | undefined, options: RequiredOptions): JsonSchema {
	if (!stats?.items)
		return { type: 'array' };

	return {
		type: 'array',
		items: schemaFromStats(stats.items, options)
	};
}

function objectSchemaFromStats(clusters: ObjectClusterStats[], options: RequiredOptions): JsonSchema {
	if (clusters.length === 1)
		return objectClusterSchemaFromStats(clusters[0], options);

	return {
		[options.unionKeyword]: clusters.map(cluster => objectClusterSchemaFromStats(cluster, options))
	};
}

function objectClusterSchemaFromStats(cluster: ObjectClusterStats, options: RequiredOptions): JsonSchema {
	const properties: NonNullable<JsonSchema['properties']> = {};
	const required: string[] = [];

	for (const [key, property] of cluster.properties) {
		properties[key] = schemaFromStats(property.stats, options);

		if (property.count === cluster.count)
			required.push(key);
	}

	const schema: JsonSchema = {
		type: 'object',
		properties,
		additionalProperties: options.additionalProperties
	};

	if (options.required && required.length)
		schema.required = required;

	return schema;
}

function stringSchemaFromStats(
	stats: StringStats | undefined,
	options: RequiredOptions,
	propertyName?: string
): JsonSchema {
	const schema: JsonSchema = { type: 'string' };
	const format = options.inferFormats ? inferStringFormat(stats) : undefined;

	if (format) {
		schema.format = format;

		return schema;
	}

	const enumValues = options.inferEnums ? inferStringEnum(stats, options, propertyName) : undefined;

	if (enumValues)
		schema.enum = enumValues;

	return schema;
}

function inferStringEnum(
	stats: StringStats | undefined,
	options: RequiredOptions,
	propertyName?: string
): string[] | undefined {
	if (!stats || stats.count < 3 || stats.enumOverflow || stats.hasLongEnumValue)
		return undefined;

	if (inferStringFormat(stats))
		return undefined;

	const enumNameProbability = enumNameProbabilityForProperty(propertyName, options.enumDetection);

	if (enumNameProbability === 'low' || (propertyName && enumNameProbability !== 'high'))
		return undefined;

	const hasRepeatedValue = Array.from(stats.enumCounts.values()).some(count => count > 1);

	const enumValues = Array.from(stats.enumCounts.keys());

	if (!hasRepeatedValue || enumValues.length > ENUM_MAX_VALUES)
		return undefined;

	if (enumNameProbability !== 'high' && enumValues.length / stats.count > 0.6)
		return undefined;

	return enumValues;
}

function enumNameProbabilityForProperty(
	propertyName: string | undefined,
	options: RequiredEnumDetectionOptions
): 'high' | 'low' | undefined {
	if (!propertyName)
		return undefined;

	const normalizedName = normalizePropertyName(propertyName);

	if (normalizedNameContainsAny(normalizedName, options.lowProbabilityNames))
		return 'low';

	if (normalizedNameContainsAny(normalizedName, options.highProbabilityNames))
		return 'high';

	return undefined;
}

function normalizedNameContainsAny(name: string, candidates: string[]): boolean {
	const nameTokens = new Set(name.split(' '));

	return candidates.some(candidate => {
		const candidateTokens = normalizePropertyName(candidate).split(' ');

		return candidateTokens.every(token => nameTokens.has(token));
	});
}

function normalizePropertyName(name: string): string {
	return name
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_\-.]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

function inferStringFormat(stats: StringStats | undefined): StringFormat | undefined {
	if (!stats)
		return undefined;

	const match = FORMAT_DETECTORS.find(([format]) => stats.formatCandidates.has(format));

	return match?.[0];
}

function isIsoDateTime(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
		return false;

	return !Number.isNaN(Date.parse(value));
}

function isIsoDate(value: string): boolean {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

	if (!match)
		return false;

	const date = new Date(`${value}T00:00:00.000Z`);

	return date.getUTCFullYear() === Number(match[1]) &&
		date.getUTCMonth() + 1 === Number(match[2]) &&
		date.getUTCDate() === Number(match[3]);
}

function isIsoTime(value: string): boolean {
	const match = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value);

	if (!match)
		return false;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3]);

	return hours < 24 && minutes < 60 && seconds < 60;
}

function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUri(value: string): boolean {
	try {
		const url = new URL(value);

		return Boolean(url.protocol);
	}
	catch {
		return false;
	}
}

function isUuid(value: string): boolean {
	return /^[0-9a-f]{32}$/i.test(value) ||
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isIpv4(value: string): boolean {
	const parts = value.split('.');

	return parts.length === 4 && parts.every(part => {
		if (!/^\d+$/.test(part))
			return false;

		const n = Number(part);

		return n >= 0 && n <= 255 && String(n) === part;
	});
}

function isIpv6(value: string): boolean {
	if (!/^[0-9a-f:]+$/i.test(value) || !value.includes(':'))
		return false;

	const doubleColonParts = value.split('::');

	if (doubleColonParts.length > 2)
		return false;

	const left = doubleColonParts[0] ? doubleColonParts[0].split(':') : [];
	const right = doubleColonParts[1] ? doubleColonParts[1].split(':') : [];
	const groups = [...left, ...right];

	if (!groups.every(group => /^[0-9a-f]{1,4}$/i.test(group)))
		return false;

	if (doubleColonParts.length === 2)
		return groups.length < 8;

	return groups.length === 8;
}

class DefaultJsonSchemaGenerator implements JsonSchemaGenerator {
	private readonly stats = createStats();
	private readonly options: RequiredOptions;

	constructor(options?: JsonSchemaGeneratorOptions) {
		this.options = normalizeOptions(options);
	}

	addSample(sample: unknown): JsonSchemaGenerator {
		observe(this.stats, sample, this.options, '$');

		return this;
	}

	addSamples(samples: unknown[]): JsonSchemaGenerator {
		for (const sample of samples)
			this.addSample(sample);

		return this;
	}

	toJsonSchema(options?: JsonSchemaGeneratorOptions): JsonSchema {
		return schemaFromStats(this.stats, normalizeOptions({
			...this.options,
			...options,
			objectMatchThreshold: this.options.objectMatchThreshold,
			objectMatchStrategy: this.options.objectMatchStrategy,
			objectMatchMinSharedProperties: this.options.objectMatchMinSharedProperties
		}));
	}
}

export function createJsonSchemaGenerator(
	sample?: unknown,
	options?: JsonSchemaGeneratorOptions
): JsonSchemaGenerator {
	const generator = new DefaultJsonSchemaGenerator(options);

	if (arguments.length > 0 && !(arguments.length > 1 && sample === undefined))
		generator.addSample(sample);

	return generator;
}
