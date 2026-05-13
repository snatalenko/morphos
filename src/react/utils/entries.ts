import type {
	RootMapping,
	ValueMap,
	PropertiesMap,
	ArrayMapping,
	ObjectInContextMapping,
	ObjectMapping,
	ConditionalMapping,
	ConcatMapping
} from '../../mappingTypes.ts';
export type {
	ExprEntryValue,
	ArrayEntryValue,
	ObjectEntryValue,
	ConditionalEntryValue,
	ConcatEntryValue,
	EntryValue,
	Entry
} from './entryTypes.ts';
import type {
	EntryValue,
	Entry
} from './entryTypes.ts';

export const WILDCARD_KEY = '*';

let idCounter = 0;
export const genId = () => `dm-${++idCounter}`;


function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function assertNever(value: never): never {
	throw new Error(`Unexpected mapping entry value: ${JSON.stringify(value)}`);
}

function propsToEntries(map: PropertiesMap | undefined): Entry[] {
	if (!map || Array.isArray(map))
		return [];

	return Object.entries(map).map(([key, value]) => ({
		id: genId(),
		key,
		value: valueToEntryValue(value as ValueMap)
	}));
}

function valueToEntryValue(v: ValueMap): EntryValue {
	if (typeof v === 'string')
		return { kind: 'expr', expr: v };

	if (isPlainObject(v)) {
		if ('when' in v && 'then' in v) {
			const cm = v as ConditionalMapping;
			return {
				kind: 'conditional',
				when: cm.when,
				then: valueToEntryValue(cm.then),
				else: cm.else === undefined ? undefined : valueToEntryValue(cm.else)
			};
		}
		if ('concat' in v && Object.keys(v).length === 1) {
			const cm = v as ConcatMapping;
			return { kind: 'concat', items: cm.concat.map(item => valueToEntryValue(item)) };
		}
		if ('forEach' in v && 'map' in v) {
			const am = v as ArrayMapping;
			return { kind: 'array', forEach: am.forEach, entries: propsToEntries(am.map) };
		}
		if ('from' in v && 'map' in v) {
			const cm = v as ObjectInContextMapping;
			return { kind: 'object', from: cm.from, entries: propsToEntries(cm.map) };
		}
		if ('map' in v && Object.keys(v).length === 1) {
			const om = v as ObjectMapping;
			return { kind: 'object', from: '', entries: propsToEntries(om.map) };
		}
		return { kind: 'object', from: '', entries: propsToEntries(v as PropertiesMap) };
	}

	return { kind: 'expr', expr: '' };
}

export function rootToEntries(root: RootMapping | undefined): Entry[] {
	if (root == null || typeof root === 'string' || Array.isArray(root))
		return [];

	if ('forEach' in root && 'map' in root)
		return propsToEntries((root as ArrayMapping).map);

	if ('from' in root && 'map' in root)
		return propsToEntries((root as ObjectInContextMapping).map);

	if ('map' in root && Object.keys(root).length === 1)
		return propsToEntries((root as ObjectMapping).map);

	return propsToEntries(root as PropertiesMap);
}

export function entriesToProps(entries: Entry[]): PropertiesMap {
	const out: Record<string, ValueMap> = {};
	for (const e of entries) {
		if (e.key === '')
			continue;

		out[e.key] = entryValueToValue(e.value);
	}

	return out;
}

export function convertEntryValue(prev: EntryValue, to: 'expr' | 'array' | 'object' | 'conditional' | 'concat'): EntryValue {
	if (to === 'expr') {
		if (prev.kind === 'expr')
			return prev;
		if (prev.kind === 'concat')
			return prev.items[0] ? convertEntryValue(prev.items[0], to) : { kind: 'expr', expr: '' };
		if (prev.kind === 'array')
			return { kind: 'expr', expr: prev.forEach };
		if (prev.kind === 'conditional') {
			if (prev.then.kind === 'expr')
				return prev.then;

			return { kind: 'expr', expr: prev.when };
		}

		return { kind: 'expr', expr: prev.from };
	}

	if (to === 'array') {
		if (prev.kind === 'array')
			return prev;
		if (prev.kind === 'concat')
			return prev.items[0] ? convertEntryValue(prev.items[0], to) : { kind: 'array', forEach: '', entries: [] };
		if (prev.kind === 'object')
			return { kind: 'array', forEach: prev.from, entries: prev.entries };
		if (prev.kind === 'conditional') {
			if (prev.then.kind === 'array')
				return prev.then;

			return { kind: 'array', forEach: prev.when, entries: [] };
		}

		return { kind: 'array', forEach: prev.expr, entries: [] };
	}

	if (to === 'conditional') {
		if (prev.kind === 'conditional')
			return prev;

		return { kind: 'conditional', when: '', then: prev };
	}

	if (to === 'concat') {
		if (prev.kind === 'concat')
			return prev;

		return { kind: 'concat', items: [prev] };
	}

	if (prev.kind === 'object')
		return prev;
	if (prev.kind === 'concat')
		return prev.items[0] ? convertEntryValue(prev.items[0], to) : { kind: 'object', from: '', entries: [] };
	if (prev.kind === 'array')
		return { kind: 'object', from: prev.forEach, entries: prev.entries };
	if (prev.kind === 'conditional') {
		if (prev.then.kind === 'object')
			return prev.then;

		return { kind: 'object', from: prev.when, entries: [] };
	}

	return { kind: 'object', from: prev.expr, entries: [] };
}

function entryValueToValue(ev: EntryValue): ValueMap {
	if (ev.kind === 'expr')
		return ev.expr;

	if (ev.kind === 'array')
		return { forEach: ev.forEach, map: entriesToProps(ev.entries) };

	if (ev.kind === 'object') {
		if (ev.from === '')
			return entriesToProps(ev.entries);

		return { from: ev.from, map: entriesToProps(ev.entries) };
	}

	if (ev.kind === 'conditional') {
		const result: ConditionalMapping = {
			when: ev.when,
			then: entryValueToValue(ev.then)
		};
		if (ev.else !== undefined)
			result.else = entryValueToValue(ev.else);

		return result;
	}

	if (ev.kind === 'concat')
		return { concat: ev.items.map(item => entryValueToValue(item)) };

	return assertNever(ev);
}
