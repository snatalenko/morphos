import { useContext, useRef } from 'react';
import { ComponentsContext } from './ComponentsContext.ts';
import { LabelsContext } from './LabelsContext.ts';
import {
	genId,
	convertEntryValue,
	createEntryValueForSchema,
	getPropertySchema,
	getItemsSchema,
	findSourceFields,
	resolveSourcePath,
	extendSourceSchema,
	schemaType,
	type Entry,
	type EntryValue
} from './entries.ts';
import type {
	AddKind,
	FieldOption,
	MappingEditorComponents,
	MappingSchema,
	SourceFieldMatch
} from './types.ts';

const WILDCARD_KEY = '*';

function createEntryValue(kind: AddKind): EntryValue {
	if (kind === 'array')
		return { kind: 'array', forEach: '', entries: [] };
	if (kind === 'object')
		return { kind: 'object', from: '', entries: [] };
	if (kind === 'conditional')
		return { kind: 'conditional', when: '', then: { kind: 'expr', expr: '' } };
	if (kind === 'concat')
		return { kind: 'concat', items: [] };

	return { kind: 'expr', expr: '' };
}

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

function typesCompatible(destType: string | undefined, sourceType: string | undefined): boolean {
	if (!destType)
		return true;
	if (!sourceType)
		return false;
	if (destType === sourceType)
		return true;
	if ((destType === 'number' || destType === 'integer') &&
		(sourceType === 'number' || sourceType === 'integer'))
		return true;

	return false;
}

function preferNameMatches(
	fields: SourceFieldMatch[],
	sourceSchema: MappingSchema | undefined,
	name: string,
	type?: string
): SourceFieldMatch[] {
	if (!sourceSchema || !name || fields.length < 2)
		return fields;

	const matchedPaths = new Set(
		findSourceFields(sourceSchema, { name, type }).map(s => s.path)
	);
	if (matchedPaths.size === 0 || matchedPaths.size === fields.length)
		return fields;

	return [
		...fields.filter(s => matchedPaths.has(s.path)),
		...fields.filter(s => !matchedPaths.has(s.path))
	];
}

function arrayContextSuggestions(
	recordSchema: MappingSchema | undefined,
	collectionSchema: MappingSchema | undefined
): SourceFieldMatch[] {
	return [
		{
			path: '$index',
			schema: {
				type: 'integer',
				description: 'Current array item index'
			}
		},
		{
			path: '$record',
			schema: recordSchema ?? {
				description: 'Current array item value'
			}
		},
		{
			path: '$collection',
			schema: collectionSchema ?? {
				type: 'array',
				description: 'Current array collection'
			}
		}
	];
}

function mergeSourceSuggestions(
	fields: SourceFieldMatch[],
	extraFields: SourceFieldMatch[]
): SourceFieldMatch[] {
	if (extraFields.length === 0)
		return fields;

	const seen = new Set(fields.map(f => f.path));
	return [
		...fields,
		...extraFields.filter(f => !seen.has(f.path))
	];
}

function renderExpressionInput(
	C: MappingEditorComponents,
	value: string,
	onChange: (next: string) => void,
	suggestions: SourceFieldMatch[],
	placeholder: string,
	forceSuggested = false,
	defaultAdvanced?: boolean
) {
	if (suggestions.length > 0 || forceSuggested) {
		const options: FieldOption[] = suggestions.map(s => ({ value: s.path, label: s.label }));
		return (
			<C.SuggestedValueInput
				value={value}
				onChange={onChange}
				options={options}
				placeholder={placeholder}
				defaultAdvanced={defaultAdvanced}
			/>
		);
	}

	return (
		<C.ValueInput
			value={value}
			onChange={onChange}
			placeholder={placeholder}
		/>
	);
}

function ConditionalBranch({
	label,
	value,
	onChange,
	onRemove,
	schema,
	sourceSchema,
	sourceSuggestions
}: {
	label: string;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	onRemove?: () => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
	sourceSuggestions?: SourceFieldMatch[];
}) {
	const C = useContext(ComponentsContext);
	const isSection = value.kind !== 'expr';
	const columns = onRemove
		? '4rem 9rem minmax(0, 1fr) auto'
		: '4rem 9rem minmax(0, 1fr)';

	return (
		<div
			className="dm-mapping-conditional-branch"
			style={{
				display: 'grid',
				gridTemplateColumns: columns,
				gap: '0.5rem',
				alignItems: 'start',
				marginBottom: '0.5rem'
			}}
		>
			<label className="dm-mapping-label" style={{ paddingTop: '0.35rem' }}>{label}</label>
			<C.TypeSelector
				kind={value.kind}
				onChange={to => onChange(convertEntryValue(value, to))}
			/>
			<ValueView
				name=""
				value={value}
				onChange={onChange}
				schema={schema}
				sourceSchema={sourceSchema}
				sourceSuggestions={sourceSuggestions}
				part={isSection ? 'control' : 'full'}
			/>
			{onRemove ? <C.RemoveButton onClick={onRemove} /> : null}
			{isSection && (
				<div style={{ gridColumn: '1 / -1' }}>
					<ValueView
						name=""
						value={value}
						onChange={onChange}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
						part="body"
					/>
				</div>
			)}
		</div>
	);
}

function ConcatItemView({
	index,
	value,
	onChange,
	onRemove,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	schema,
	sourceSchema,
	sourceSuggestions
}: {
	index: number;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	onRemove: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
	sourceSuggestions?: SourceFieldMatch[];
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);
	const isSection = value.kind !== 'expr';

	return (
		<div
			className="dm-mapping-concat-item"
			style={{
				display: 'grid',
				gridTemplateColumns: '4rem 9rem minmax(0, 1fr) auto',
				gap: '0.5rem',
				alignItems: 'start',
				marginBottom: '0.5rem'
			}}
		>
			<label className="dm-mapping-label" style={{ paddingTop: '0.35rem' }}>
				{labels.concatItem} {index + 1}
			</label>
			<C.TypeSelector
				kind={value.kind}
				onChange={to => onChange(convertEntryValue(value, to))}
			/>
			<ValueView
				name=""
				value={value}
				onChange={onChange}
				schema={schema}
				sourceSchema={sourceSchema}
				sourceSuggestions={sourceSuggestions}
				part={isSection ? 'control' : 'full'}
			/>
			<span className="dm-mapping-actions">
				<C.Reorder
					canMoveUp={canMoveUp}
					canMoveDown={canMoveDown}
					onMoveUp={onMoveUp}
					onMoveDown={onMoveDown}
				/>
				<C.RemoveButton onClick={onRemove} />
			</span>
			{isSection && (
				<div style={{ gridColumn: '1 / -1' }}>
					<ValueView
						name=""
						value={value}
						onChange={onChange}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
						part="body"
					/>
				</div>
			)}
		</div>
	);
}

function ValueView({
	name,
	value,
	onChange,
	schema,
	sourceSchema,
	sourceSuggestions = [],
	part = 'full'
}: {
	name: string;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
	sourceSuggestions?: SourceFieldMatch[];
	part?: 'full' | 'control' | 'body';
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);

	if (value.kind === 'expr') {
		const destType = schemaType(schema);
		const allScalars = sourceSchema
			? findSourceFields(sourceSchema, {}).filter(s => {
				const t = schemaType(s.schema);
				if (name === WILDCARD_KEY)
					return typesCompatible(destType, t);
				if (t === 'object' || t === 'array')
					return false;

				return typesCompatible(destType, t);
			})
			: [];
		const suggestions = preferNameMatches(
			mergeSourceSuggestions(allScalars, sourceSuggestions),
			sourceSchema,
			name
		);
		return renderExpressionInput(
			C,
			value.expr,
			expr => onChange({ kind: 'expr', expr }),
			suggestions,
			labels.expressionPlaceholder,
			!!sourceSchema
		);
	}

	if (value.kind === 'array') {
		const itemsSchema = getItemsSchema(schema);
		const forEachSuggestions = preferNameMatches(
			mergeSourceSuggestions(
				findSourceFields(sourceSchema, { type: 'array' }),
				sourceSuggestions.filter(s => schemaType(s.schema) === 'array')
			),
			sourceSchema,
			name,
			'array'
		);
		const resolved = resolveSourcePath(sourceSchema, value.forEach);
		const resolvedItems = (resolved && schemaType(resolved) === 'array')
			? getItemsSchema(resolved)
			: undefined;
		const nestedSourceSchema = extendSourceSchema(resolvedItems, sourceSchema, value.forEach);
		const nestedSourceSuggestions = arrayContextSuggestions(resolvedItems, resolved);
		const valueInput = renderExpressionInput(
			C,
			value.forEach,
			forEach => onChange({ ...value, forEach }),
			forEachSuggestions,
			labels.expressionPlaceholder,
			!!sourceSchema,
			false
		);
		const body = (
			<EntriesEditor
				entries={value.entries}
				onChange={entries => onChange({ ...value, entries })}
				schema={itemsSchema}
				sourceSchema={nestedSourceSchema}
				sourceSuggestions={nestedSourceSuggestions}
			/>
		);

		if (part === 'control')
			return valueInput;
		if (part === 'body')
			return <C.Section body={body} />;

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="forEach"
						valueInput={valueInput}
					/>
				}
				body={body}
			/>
		);
	}

	if (value.kind === 'object') {
		const fromSuggestions = preferNameMatches(
			mergeSourceSuggestions(
				findSourceFields(sourceSchema, { type: 'object' }),
				sourceSuggestions.filter(s => schemaType(s.schema) === 'object')
			),
			sourceSchema,
			name,
			'object'
		);
		const resolved = resolveSourcePath(sourceSchema, value.from);
		const resolvedFrom = (resolved && schemaType(resolved) === 'object')
			? resolved
			: undefined;
		const nestedSourceSchema = extendSourceSchema(resolvedFrom, sourceSchema, value.from);
		const fromWithRoot: SourceFieldMatch[] = [
			{ path: '', schema: {} },
			...fromSuggestions
		];
		const valueInput = renderExpressionInput(
			C,
			value.from,
			from => onChange({ ...value, from }),
			fromWithRoot,
			labels.expressionPlaceholder,
			!!sourceSchema
		);
		const body = (
			<EntriesEditor
				entries={value.entries}
				onChange={entries => onChange({ ...value, entries })}
				schema={schema}
				sourceSchema={nestedSourceSchema}
				sourceSuggestions={sourceSuggestions}
			/>
		);

		if (part === 'control')
			return valueInput;
		if (part === 'body')
			return <C.Section body={body} />;

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="from"
						valueInput={valueInput}
					/>
				}
				body={body}
			/>
		);
	}

	if (value.kind === 'conditional') {
		const addElse = () => onChange({ ...value, else: { kind: 'expr', expr: '' } });
		const removeElse = () => onChange({ kind: 'conditional', when: value.when, then: value.then });
		const whenSuggestions = mergeSourceSuggestions(
			findSourceFields(sourceSchema, {}),
			sourceSuggestions
		).filter(s => {
			const t = schemaType(s.schema);
			return t !== 'object' && t !== 'array';
		});
		const valueInput = renderExpressionInput(
			C,
			value.when,
			when => onChange({ ...value, when }),
			whenSuggestions,
			labels.expressionPlaceholder,
			!!sourceSchema,
			true
		);
		const body = (
			<>
				<ConditionalBranch
					label={labels.then}
					value={value.then}
					onChange={thenValue => onChange({ ...value, then: thenValue })}
					schema={schema}
					sourceSchema={sourceSchema}
					sourceSuggestions={sourceSuggestions}
				/>
				{value.else === undefined ? (
					<div className="dm-mapping-conditional-add-else">
						<C.AddElseButton onClick={addElse} />
					</div>
				) : (
					<ConditionalBranch
						label={labels.else}
						value={value.else}
						onChange={elseValue => onChange({ ...value, else: elseValue })}
						onRemove={removeElse}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
					/>
				)}
			</>
		);

		if (part === 'control')
			return valueInput;
		if (part === 'body')
			return <C.Section body={body} />;

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="when"
						valueInput={valueInput}
					/>
				}
				body={body}
			/>
		);
	}

	if (value.kind === 'concat') {
		const updateItem = (index: number, nextValue: EntryValue) => {
			const next = value.items.slice();
			next[index] = nextValue;
			onChange({ ...value, items: next });
		};
		const removeItem = (index: number) => {
			onChange({ ...value, items: value.items.filter((_, i) => i !== index) });
		};
		const moveItem = (index: number, direction: -1 | 1) => {
			const target = index + direction;
			if (target < 0 || target >= value.items.length)
				return;

			const next = value.items.slice();
			const [moved] = next.splice(index, 1);
			next.splice(target, 0, moved);
			onChange({ ...value, items: next });
		};
		const addItem = () => {
			onChange({ ...value, items: [...value.items, createEntryValue('expr')] });
		};
		const body = (
			<>
				{value.items.map((item, index) => (
					<ConcatItemView
						key={index}
						index={index}
						value={item}
						onChange={nextValue => updateItem(index, nextValue)}
						onRemove={() => removeItem(index)}
						canMoveUp={index > 0}
						canMoveDown={index < value.items.length - 1}
						onMoveUp={() => moveItem(index, -1)}
						onMoveDown={() => moveItem(index, 1)}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
					/>
				))}
				<C.AddItemButton onClick={addItem} />
			</>
		);

		if (part === 'control')
			return null;
		return <C.Section body={body} />;
	}

	throw new Error(`Unknown mapping value kind: ${JSON.stringify(value)}`);
}
