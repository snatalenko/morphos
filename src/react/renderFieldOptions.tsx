import type { ReactNode } from 'react';
import type { FieldOption, FieldOptionGroup, MappingEditorLabels } from './types.ts';

const groups: Array<{
	group: FieldOptionGroup;
	label: (labels: MappingEditorLabels) => string;
}> = [
	{ group: 'enum', label: labels => labels.enumValues },
	{ group: 'field', label: labels => labels.nestedFields },
	{ group: 'parentField', label: labels => labels.parentFields },
	{ group: 'internal', label: labels => labels.internalVariables }
];

function renderOption(option: FieldOption, index: number): ReactNode {
	return (
		<option key={`${option.group ?? 'root'}:${option.value}:${index}`} value={option.value}>
			{option.label ?? option.value}
		</option>
	);
}

export function renderFieldOptions(
	options: FieldOption[],
	labels: MappingEditorLabels
): ReactNode {
	const rootOptions = options.filter(option => !option.group);

	return (
		<>
			{rootOptions.map(renderOption)}
			{groups.map(({ group, label }) => {
				const groupOptions = options.filter(option => option.group === group);
				if (groupOptions.length === 0)
					return null;

				return (
					<optgroup key={group} label={label(labels)}>
						{groupOptions.map(renderOption)}
					</optgroup>
				);
			})}
		</>
	);
}
