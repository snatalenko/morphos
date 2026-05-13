import { useContext } from 'react';
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
	MappingEditorComponents,
	MappingSchema,
	SchemaFieldOption,
	SourceFieldMatch
} from './types.ts';

export function EntriesEditor({
	entries,
	onChange,
	schema,
	sourceSchema
}: {
	entries: Entry[];
	onChange: (next: Entry[]) => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);

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

	const addEntry = (kind: AddKind) => {
		let value: EntryValue;
		if (kind === 'array')
			value = { kind: 'array', forEach: '', entries: [] };
		else if (kind === 'object')
			value = { kind: 'object', from: '', entries: [] };
		else if (kind === 'conditional')
			value = { kind: 'conditional', when: '', then: { kind: 'expr', expr: '' } };
		else
			value = { kind: 'expr', expr: '' };

		onChange([...entries, { id: genId(), key: '', value }]);
	};

	const requiredSet = new Set(schema?.required ?? []);
	const schemaPropNames = schema?.properties ? Object.keys(schema.properties) : [];
	const mappedKeys = new Set(entries.map(e => e.key));

	const availableForEntry = (entry: Entry): SchemaFieldOption[] => {
		const result: SchemaFieldOption[] = [];
		for (const name of schemaPropNames) {
			if (name !== entry.key && mappedKeys.has(name))
				continue;

			const sub = getPropertySchema(schema, name);
			if (!sub)
				continue;

			result.push({ name, schema: sub, required: requiredSet.has(name) });
		}

		return result;
	};

	const updateEntryKey = (id: string, newKey: string) => {
		const newSub = getPropertySchema(schema, newKey);
		onChange(entries.map(e => {
			if (e.id !== id)
				return e;

			if (newSub) {
				const expected = createEntryValueForSchema(newSub);
				return {
					...e,
					key: newKey,
					value: e.value.kind === expected.kind ? e.value : expected
				};
			}

			return { ...e, key: newKey };
		}));
	};

	return (
		<C.Container>
			{entries.map((entry, index) => {
				const subSchema = getPropertySchema(schema, entry.key);

				const keyCell = schema ? (
					<C.SuggestedKeyInput
						value={entry.key}
						onChange={k => updateEntryKey(entry.id, k)}
						available={availableForEntry(entry)}
						placeholder={labels.keyPlaceholder}
					/>
				) : (
					<C.KeyInput
						value={entry.key}
						onChange={k => updateEntry(entry.id, { key: k })}
						placeholder={labels.keyPlaceholder}
					/>
				);

				const valueView = (
					<ValueView
						name={entry.key}
						value={entry.value}
						onChange={v => updateEntry(entry.id, { value: v })}
						schema={subSchema}
						sourceSchema={sourceSchema}
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
						section={valueView}
						remove={remove}
						reorder={reorder}
					/>
				);
			})}
			<C.AddBar onAdd={addEntry} />
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

function renderExpressionInput(
	C: MappingEditorComponents,
	value: string,
	onChange: (next: string) => void,
	suggestions: SourceFieldMatch[],
	placeholder: string,
	forceSuggested = false,
	emptyLabel?: string,
	defaultAdvanced?: boolean
) {
	if (suggestions.length > 0 || forceSuggested) {
		return (
			<C.SuggestedValueInput
				value={value}
				onChange={onChange}
				suggestions={suggestions}
				placeholder={placeholder}
				emptyLabel={emptyLabel}
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
	sourceSchema
}: {
	label: string;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	onRemove?: () => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
}) {
	const C = useContext(ComponentsContext);
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
			/>
			{onRemove ? <C.RemoveButton onClick={onRemove} /> : null}
		</div>
	);
}

function ValueView({
	name,
	value,
	onChange,
	schema,
	sourceSchema
}: {
	name: string;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	schema?: MappingSchema;
	sourceSchema?: MappingSchema;
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);

	if (value.kind === 'expr') {
		const destType = schemaType(schema);
		const allScalars = sourceSchema
			? findSourceFields(sourceSchema, {}).filter(s => {
				const t = schemaType(s.schema);
				if (t === 'object' || t === 'array')
					return false;

				return typesCompatible(destType, t);
			})
			: [];
		const suggestions = preferNameMatches(allScalars, sourceSchema, name);
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
			findSourceFields(sourceSchema, { type: 'array' }),
			sourceSchema,
			name,
			'array'
		);
		const resolved = resolveSourcePath(sourceSchema, value.forEach);
		const resolvedItems = (resolved && schemaType(resolved) === 'array')
			? getItemsSchema(resolved)
			: undefined;
		const nestedSourceSchema = extendSourceSchema(resolvedItems, sourceSchema, value.forEach);

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="forEach"
						valueInput={renderExpressionInput(
							C,
							value.forEach,
							forEach => onChange({ ...value, forEach }),
							forEachSuggestions,
							labels.expressionPlaceholder,
							!!sourceSchema
						)}
					/>
				}
				body={
					<EntriesEditor
						entries={value.entries}
						onChange={entries => onChange({ ...value, entries })}
						schema={itemsSchema}
						sourceSchema={nestedSourceSchema}
					/>
				}
			/>
		);
	}

	if (value.kind === 'object') {
		const fromSuggestions = preferNameMatches(
			findSourceFields(sourceSchema, { type: 'object' }),
			sourceSchema,
			name,
			'object'
		);
		const resolved = resolveSourcePath(sourceSchema, value.from);
		const resolvedFrom = (resolved && schemaType(resolved) === 'object')
			? resolved
			: undefined;
		const nestedSourceSchema = extendSourceSchema(resolvedFrom, sourceSchema, value.from);

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="from"
						valueInput={renderExpressionInput(
							C,
							value.from,
							from => onChange({ ...value, from }),
							fromSuggestions,
							'',
							!!sourceSchema,
							''
						)}
					/>
				}
				body={
					<EntriesEditor
						entries={value.entries}
						onChange={entries => onChange({ ...value, entries })}
						schema={schema}
						sourceSchema={nestedSourceSchema}
					/>
				}
			/>
		);
	}

	if (value.kind === 'conditional') {
		const addElse = () => onChange({ ...value, else: { kind: 'expr', expr: '' } });
		const removeElse = () => onChange({ kind: 'conditional', when: value.when, then: value.then });
		const whenSuggestions = findSourceFields(sourceSchema, {}).filter(s => {
			const t = schemaType(s.schema);
			return t !== 'object' && t !== 'array';
		});

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="when"
						valueInput={renderExpressionInput(
							C,
							value.when,
							when => onChange({ ...value, when }),
							whenSuggestions,
							labels.expressionPlaceholder,
							!!sourceSchema,
							undefined,
							true
						)}
					/>
				}
				body={
					<>
						<ConditionalBranch
							label={labels.then}
							value={value.then}
							onChange={thenValue => onChange({ ...value, then: thenValue })}
							schema={schema}
							sourceSchema={sourceSchema}
						/>
						{value.else === undefined ? (
							<div className="dm-mapping-conditional-add-else" style={{ textAlign: 'right' }}>
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
							/>
						)}
					</>
				}
			/>
		);
	}

	throw new Error(`Unknown mapping value kind: ${JSON.stringify(value)}`);
}
