import type { JsonSchema } from '../JsonSchema.ts';

export type JsonSchemaGeneratorOptions = {

	/**
	 * Keyword used when samples cannot be represented by a single schema.
	 * Defaults to "oneOf".
	 */
	unionKeyword?: 'oneOf' | 'anyOf';

	/**
	 * Minimum ratio of shared object property names required to merge an object
	 * sample into an existing object schema cluster. A value of 0.5 means the
	 * sample must share at least half of the combined property names with the
	 * cluster. Defaults to 0.5.
	 */
	objectMatchThreshold?: number;

	/**
	 * Infer string enums from repeated low-cardinality values. Defaults to true.
	 */
	inferEnums?: boolean;

	/**
	 * Infer common string formats such as date-time, date, email, uri, uuid,
	 * ipv4, and ipv6. Defaults to true.
	 */
	inferFormats?: boolean;
}

export type JsonSchemaGenerator = {
	addSample(sample: unknown): JsonSchemaGenerator;
	addSamples(samples: unknown[]): JsonSchemaGenerator;
	toJsonSchema(options?: JsonSchemaGeneratorOptions): JsonSchema;
}

type JsonType = 'null' | 'boolean' | 'string' | 'integer' | 'number' | 'object' | 'array';

type RequiredOptions = Required<JsonSchemaGeneratorOptions>;

type StringFormat = 'date-time' | 'date' | 'time' | 'email' | 'uri' | 'uuid' | 'ipv4' | 'ipv6';

type JsonSchemaStats = {
	count: number;
	types: JsonType[];
	string?: StringStats;
	array?: ArrayStats;
	objectClusters: ObjectClusterStats[];
}

type StringStats = {
	count: number;
	enumCounts: Map<string, number>;
	enumOverflow: boolean;
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

const DEFAULT_OPTIONS: RequiredOptions = {
	unionKeyword: 'oneOf',
	objectMatchThreshold: 0.5,
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
		...options
	};
}

function createStats(): JsonSchemaStats {
	return {
		count: 0,
		types: [],
		objectClusters: []
	};
}

function createStringStats(): StringStats {
	return {
		count: 0,
		enumCounts: new Map(),
		enumOverflow: false,
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

		return;
	}

	if (typeof sample === 'string') {
		observeType(stats, 'string');
		observeString(stats, sample);

		return;
	}

	if (typeof sample === 'boolean') {
		observeType(stats, 'boolean');

		return;
	}

	if (typeof sample === 'number') {
		if (!Number.isFinite(sample))
			throw new TypeError(`Invalid JSON sample at "${path}": numbers must be finite`);

		observeType(stats, Number.isInteger(sample) ? 'integer' : 'number');

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

function observeString(stats: JsonSchemaStats, value: string): void {
	const stringStats = stats.string ?? (stats.string = createStringStats());

	stringStats.count++;
	observeStringEnum(stringStats, value);
	observeStringFormat(stringStats, value);
}

function observeStringEnum(stats: StringStats, value: string): void {
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
	const cluster = matchingObjectCluster(stats.objectClusters, sample, options.objectMatchThreshold);

	cluster.count++;

	for (const [key, value] of Object.entries(sample)) {
		cluster.keys.add(key);

		let property = cluster.properties.get(key);

		if (!property) {
			property = {
				count: 0,
				stats: createStats()
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
	threshold: number
): ObjectClusterStats {
	const sampleKeys = new Set(Object.keys(sample));
	const cluster = clusters.find(existing => objectSimilarity(sampleKeys, existing.keys) >= threshold);

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

function objectSimilarity(sampleKeys: Set<string>, existingKeys: Set<string>): number {
	const unionKeys = new Set([...existingKeys, ...sampleKeys]);

	if (!unionKeys.size)
		return 1;

	let shared = 0;

	for (const key of sampleKeys) {
		if (existingKeys.has(key))
			shared++;
	}

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
		return { type: 'null' };

	if (nonNullTypes.length === 1) {
		const schema = schemaForType(stats, nonNullTypes[0], options);

		return hasNull ? schemaWithNullable(schema) : schema;
	}

	if (nonNullTypes.every(isPrimitiveType))
		return { type: types };

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
	if (type === 'string')
		return stringSchemaFromStats(stats.string, options);

	if (type === 'object')
		return objectSchemaFromStats(stats.objectClusters, options);

	if (type === 'array')
		return arraySchemaFromStats(stats.array, options);

	return { type };
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
		properties
	};

	if (required.length)
		schema.required = required;

	return schema;
}

function stringSchemaFromStats(stats: StringStats | undefined, options: RequiredOptions): JsonSchema {
	const schema: JsonSchema = { type: 'string' };
	const format = options.inferFormats ? inferStringFormat(stats) : undefined;

	if (format) {
		schema.format = format;

		return schema;
	}

	const enumValues = options.inferEnums ? inferStringEnum(stats) : undefined;

	if (enumValues)
		schema.enum = enumValues;

	return schema;
}

function inferStringEnum(stats: StringStats | undefined): string[] | undefined {
	if (!stats || stats.count < 3 || stats.enumOverflow)
		return undefined;

	const hasRepeatedValue = Array.from(stats.enumCounts.values()).some(count => count > 1);

	const enumValues = Array.from(stats.enumCounts.keys());

	if (!hasRepeatedValue || enumValues.length > ENUM_MAX_VALUES || enumValues.length / stats.count > 0.6)
		return undefined;

	return enumValues;
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
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
			objectMatchThreshold: this.options.objectMatchThreshold
		}));
	}
}

export function createJsonSchemaGenerator(
	sample?: unknown,
	options?: JsonSchemaGeneratorOptions
): JsonSchemaGenerator {
	const generator = new DefaultJsonSchemaGenerator(options);

	if (arguments.length > 0)
		generator.addSample(sample);

	return generator;
}
