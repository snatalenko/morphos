import type { MappingSchema } from '../types.ts';
import type { EntryValue } from './entryTypes.ts';
import { schemaType } from './schemaProps.ts';

export function createEntryValueForSchema(schema: MappingSchema): EntryValue {
	const t = schemaType(schema);
	if (t === 'object')
		return { kind: 'object', from: '', entries: [] };
	if (t === 'array')
		return { kind: 'array', forEach: '', entries: [] };

	return { kind: 'expr', expr: '' };
}
