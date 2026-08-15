import type { AddKind } from '../types.ts';
import type { EntryValue } from './entryTypes.ts';

export function createEntryValue(kind: AddKind): EntryValue {
	if (kind === 'array')
		return { kind: 'array', forEach: '', entries: [] };
	if (kind === 'object')
		return { kind: 'object', from: '', entries: [] };
	if (kind === 'conditional')
		return { kind: 'conditional', when: '', then: { kind: 'expr', expr: '' } };
	if (kind === 'concat')
		return { kind: 'concat', items: [] };
	if (kind === 'tuple')
		return { kind: 'tuple', items: [] };

	return { kind: 'expr', expr: '' };
}
