import { useContext, useEffect, useRef } from 'react';
import { ComponentsContext } from './ComponentsContext.ts';
import { LabelsContext } from './LabelsContext.ts';
import {
	genId,
	convertEntryValueForSchema,
	getPropertySchema,
	createEntryValueForSchema,
	createEntryValue,
	suggestedKeyOptions,
	WILDCARD_KEY,
	type Entry
} from './utils/index.ts';
import type {
	AddKind,
	FieldOption,
	JsonSchema,
	SourceFieldMatch
} from './types.ts';
import { ValueView } from './ValueView.tsx';

export function EntriesEditor({
	entries,
	onChange,
	schema,
	sourceSchema,
	sourceSuggestions = [],
	wildcardCreatesSpread = false
}: {
	entries: Entry[];
	onChange: (next: Entry[]) => void;
	schema?: JsonSchema;
	sourceSchema?: JsonSchema;
	sourceSuggestions?: SourceFieldMatch[];
	wildcardCreatesSpread?: boolean;
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
		if (key === WILDCARD_KEY && wildcardCreatesSpread) {
			return {
				id,
				key,
				value: { kind: 'expr', expr: WILDCARD_KEY },
				keyAdvanced
			};
		}

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

	const wildcardEntry = entries.find(e => e.key === WILDCARD_KEY);
	const wildcardIsSpread = wildcardEntry?.value.kind === 'expr' && wildcardEntry.value.expr === WILDCARD_KEY;
	const currentValueMapped = wildcardEntry !== undefined && !wildcardIsSpread;

	const availableForEntry = (entry: Entry): FieldOption[] => {
		if (!schema)
			return [];

		return suggestedKeyOptions(entries, entry, schema, labels.currentValue);
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

			const nextEntry = { ...e, rootValue: undefined };

			if (newSub) {
				const expected = createEntryValueForSchema(newSub);
				return {
					...nextEntry,
					key: newKey,
					value: e.value.kind === expected.kind ? e.value : expected,
					keyAdvanced: false
				};
			}

			return { ...nextEntry, key: newKey, keyAdvanced: true };
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
						onChange={to => updateEntry(entry.id, {
							value: convertEntryValueForSchema(entry.value, to, subSchema)
						})}
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
