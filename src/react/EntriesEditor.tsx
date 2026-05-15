import { useContext, useEffect, useRef } from 'react';
import { ComponentsContext } from './ComponentsContext.ts';
import { LabelsContext } from './LabelsContext.ts';
import {
	genId,
	convertEntryValue,
	getPropertySchema,
	createEntryValueForSchema,
	createEntryValue,
	WILDCARD_KEY,
	type Entry
} from './utils/index.ts';
import type {
	AddKind,
	FieldOption,
	MappingSchema,
	SourceFieldMatch
} from './types.ts';
import { ValueView } from './ValueView.tsx';

export function EntriesEditor({
	entries,
	onChange,
	schema,
	sourceSchema,
	sourceSuggestions = []
}: {
	entries: Entry[];
	onChange: (next: Entry[]) => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
	sourceSuggestions?: SourceFieldMatch[];
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);
	const draftEntryId = useRef(genId());
	const focusAdvancedEntryId = useRef<string | null>(null);

	useEffect(() => {
		focusAdvancedEntryId.current = null;
	});

	const updateEntry = (id: string, patch: Partial<Entry>) => {
		onChange(entries.map(e => (e.id === id ? { ...e, ...patch } : e)));
	};
	const removeEntry = (id: string) => onChange(entries.filter(e => e.id !== id));
	const moveEntry = (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= entries.length)
			return;

		const next = entries.slice();
		const [moved] = next.splice(index, 1);
		next.splice(target, 0, moved);
		onChange(next);
	};

	const createEntryForKey = (key: string, keyAdvanced = false, id = genId()): Entry => {
		const sub = key === WILDCARD_KEY ? schema : getPropertySchema(schema, key);
		const value = sub ? createEntryValueForSchema(sub) : createEntryValue('expr');
		return { id, key, value, keyAdvanced };
	};

	const addEntry = (kind: AddKind, key = '', keyAdvanced = false, id = genId()) => {
		onChange([...entries, { id, key, value: createEntryValue(kind), keyAdvanced }]);
	};

	const addEntryForKey = (key: string, keyAdvanced = false, id = genId()) => {
		onChange([...entries, createEntryForKey(key, keyAdvanced, id)]);
	};

	const requiredSet = new Set(schema?.required ?? []);
	const schemaPropNames = schema?.properties ? Object.keys(schema.properties) : [];
	const mappedKeys = new Set(entries.map(e => e.key));
	const currentValueMapped = mappedKeys.has(WILDCARD_KEY);
	const canMapCurrentValue = entries.length <= 1;

	const availableForEntry = (entry: Entry): FieldOption[] => {
		const result: FieldOption[] = [];

		if (entry.key === WILDCARD_KEY || (!currentValueMapped && canMapCurrentValue))
			result.push({ value: WILDCARD_KEY, label: labels.currentValue });

		for (const name of schemaPropNames) {
			if (name !== entry.key && mappedKeys.has(name))
				continue;

			if (!getPropertySchema(schema, name))
				continue;

			const required = requiredSet.has(name);
			result.push({ value: name, label: name + (required ? ' *' : '') });
		}

		return result;
	};

	const updateEntryKey = (id: string, newKey: string) => {
		const newSub = newKey === WILDCARD_KEY ? schema : getPropertySchema(schema, newKey);
		if (id === draftEntryId.current) {
			if (newKey === '')
				return;

			const nextId = draftEntryId.current;
			draftEntryId.current = genId();
			addEntryForKey(newKey, !newSub, nextId);
			return;
		}

		onChange(entries.map(e => {
			if (e.id !== id)
				return e;

			if (newSub) {
				const expected = createEntryValueForSchema(newSub);
				return {
					...e,
					key: newKey,
					value: e.value.kind === expected.kind ? e.value : expected,
					keyAdvanced: false
				};
			}

			return { ...e, key: newKey, keyAdvanced: true };
		}));
	};

	const promoteTemplateToAdvanced = () => {
		const nextId = draftEntryId.current;
		draftEntryId.current = genId();
		focusAdvancedEntryId.current = nextId;
		addEntry('expr', '', true, nextId);
	};

	const templateEntry: Entry = {
		id: draftEntryId.current,
		key: '',
		value: createEntryValue('expr'),
		template: true
	};
	const renderedEntries = currentValueMapped ? entries : [...entries, templateEntry];

	return (
		<C.Container>
			{renderedEntries.map((entry, index) => {
				const isTemplate = entry.template === true;
				const subSchema = entry.key === WILDCARD_KEY
					? schema
					: getPropertySchema(schema, entry.key);

				const keyCell = schema ? (
					<C.SuggestedKeyInput
						value={entry.key}
						onChange={k => updateEntryKey(entry.id, k)}
						options={availableForEntry(entry)}
						placeholder={isTemplate ? labels.newField : labels.keyPlaceholder}
						defaultAdvanced={!isTemplate && entry.keyAdvanced}
						focusOnAdvancedMount={!isTemplate && focusAdvancedEntryId.current === entry.id}
						onAdvanced={isTemplate ? promoteTemplateToAdvanced : undefined}
					/>
				) : (
					<C.KeyInput
						value={entry.key}
						onChange={k => {
							if (isTemplate && k === '')
								return;

							updateEntryKey(entry.id, k);
						}}
						placeholder={labels.keyPlaceholder}
					/>
				);

				if (isTemplate) {
					return (
						<C.Row
							key={entry.id}
							keyInput={keyCell}
							typeSelector={null}
							value={null}
							remove={null}
							reorder={null}
						/>
					);
				}

				const valueView = (
					<ValueView
						name={entry.key}
						value={entry.value}
						onChange={v => updateEntry(entry.id, { value: v })}
						schema={subSchema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
						part="full"
					/>
				);
				const remove = <C.RemoveButton onClick={() => removeEntry(entry.id)} />;
				const reorder = (
					<C.Reorder
						canMoveUp={index > 0}
						canMoveDown={index < entries.length - 1}
						onMoveUp={() => moveEntry(index, -1)}
						onMoveDown={() => moveEntry(index, 1)}
					/>
				);
				const typeSelector = (
					<C.TypeSelector
						kind={entry.value.kind}
						onChange={to => updateEntry(entry.id, { value: convertEntryValue(entry.value, to) })}
					/>
				);

				if (entry.value.kind === 'expr') {
					return (
						<C.Row
							key={entry.id}
							keyInput={keyCell}
							typeSelector={typeSelector}
							value={valueView}
							remove={remove}
							reorder={reorder}
						/>
					);
				}

				return (
					<C.SectionRow
						key={entry.id}
						keyInput={keyCell}
						typeSelector={typeSelector}
						value={
							<ValueView
								name={entry.key}
								value={entry.value}
								onChange={v => updateEntry(entry.id, { value: v })}
								schema={subSchema}
								sourceSchema={sourceSchema}
								sourceSuggestions={sourceSuggestions}
								part="control"
							/>
						}
						section={
							<ValueView
								name={entry.key}
								value={entry.value}
								onChange={v => updateEntry(entry.id, { value: v })}
								schema={subSchema}
								sourceSchema={sourceSchema}
								sourceSuggestions={sourceSuggestions}
								part="body"
							/>
						}
						remove={remove}
						reorder={reorder}
					/>
				);
			})}
		</C.Container>
	);
}
