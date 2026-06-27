import type { FieldOption, JsonSchema } from '../types.ts';
import type { Entry } from './entryTypes.ts';
import { WILDCARD_KEY } from './entryConstants.ts';

export function suggestedKeyOptions(
	entries: Entry[],
	entry: Entry,
	schema: JsonSchema,
	currentValueLabel: string
): FieldOption[] {
	const requiredSet = new Set(schema.required ?? []);
	const schemaPropNames = schema.properties ? Object.keys(schema.properties) : [];
	const mappedKeys = new Set(entries.map(e => e.key));
	const hasOtherMappedEntries = entries.some(e => e.id !== entry.id && e.key !== '');
	const result: FieldOption[] = [];

	if (entry.key === WILDCARD_KEY || (!hasOtherMappedEntries && !mappedKeys.has(WILDCARD_KEY)))
		result.push({ value: WILDCARD_KEY, label: currentValueLabel });

	for (const name of schemaPropNames) {
		if (name !== entry.key && mappedKeys.has(name))
			continue;

		if (!schema.properties?.[name])
			continue;

		const required = requiredSet.has(name);
		result.push({ value: name, label: name + (required ? ' *' : ''), group: 'field' });
	}

	return result;
}
